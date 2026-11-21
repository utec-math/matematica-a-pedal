import {assertTestEnvironment} from './environment.mjs';
const $=id=>document.getElementById(id),escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let api,user,profile,space='student',page='learner',groups=[],memberships=[],selected=null,rows=[],myUnits=[],preview=null,invitation=null,cursor=null,nextCursor=null,history=[],selectedStudent=null,confirmation=null,busy=false,epoch=0,messageTimer,createRequestId=null;
const fmt=timestamp=>timestamp?new Date(timestamp).toLocaleDateString('es-UY'):'Sin datos';
const button=(label,action,secondary=false)=>`<button class="btn ${secondary?'secondary':''}" data-action="${action}">${label}</button>`;
function tell(text){$('message').textContent=text;clearTimeout(messageTimer);messageTimer=setTimeout(()=>$('message').textContent='',6500)}
function identity(){return user?.displayName||user?.email||'Tu cuenta'}
function progress(unit){return unit.completed===null?'Sin datos':`${unit.completed}/${unit.total} · ${Math.round(100*unit.completed/unit.total)}%`}
function clearSession(){user=null;profile=null;groups=[];memberships=[];rows=[];myUnits=[];preview=null;invitation=null;selected=null;selectedStudent=null;confirmation=null;cursor=null;nextCursor=null;history=[];createRequestId=null;page='learner';space='student'}
async function request(action,payload={}){const captured=epoch,result=await api.call(action,payload);if(captured!==epoch)throw Error('La sesión cambió. Volvé a abrir la vista.');return result}
function groupSelector(){return `<div class="selector"><label for="group-select">Grupo seleccionado</label><select id="group-select">${groups.map(g=>`<option value="${g.id}" ${g.id===selected?'selected':''}>${escape(g.name)}${g.status==='archived'?' · Archivado':''}</option>`).join('')}</select></div>`}
function group(){return groups.find(g=>g.id===selected)}
async function loadGroups(){groups=[];let next=null;do{const result=await request('listTeacherGroups',{cursor:next});groups.push(...result.groups);next=result.nextCursor}while(next);if(!groups.some(g=>g.id===selected))selected=groups.find(g=>g.status==='active')?.id||groups[0]?.id||null}
async function refresh(){
  if(!user)return;
  if(space==='teacher'&&profile.teacherEnabled){await loadGroups();if(page==='group'&&selected&&group().status==='active'){const result=await request('getGroupProgress',{groupId:selected,cursor});rows=result.students;nextCursor=result.nextCursor;groups=groups.map(g=>g.id===selected?result.group:g)}}
  if(space==='student'){memberships=(await request('listMemberships')).groups;if(page==='learner')myUnits=(await request('getMyProgress')).units}
}
function nav(){
  $('identity').textContent=identity();$('logout').hidden=!user;
  if(!user){$('navigation').innerHTML='';return}
  const choose=profile?.teacherEnabled?`<label for="space-select" class="small">Estás en</label><select id="space-select" class="workspace-select"><option value="student" ${space==='student'?'selected':''}>Mi espacio estudiante</option><option value="teacher" ${space==='teacher'?'selected':''}>Mi espacio docente</option></select>`:'<p>Mi espacio estudiante</p>';
  const items=space==='teacher'?[['groups','Mis grupos'],['group','Avances del grupo'],['manage','Administrar grupo']]:[['learner','Mi recorrido'],['join','Unirme a un grupo'],['memberships','Mis grupos']];
  $('navigation').innerHTML=choose+`<nav class="nav" aria-label="Menú ${space==='teacher'?'docente':'estudiante'}">${items.map(([id,label])=>`<button data-page="${id}" class="${page===id?'active':''}" ${page===id?'aria-current="page"':''}>${label}</button>`).join('')}</nav>`+(!profile?.teacherEnabled?'<button class="btn secondary" data-page="activate" style="margin-top:22px">Quiero enseñar</button>':'');
}
function render(){
  nav();document.body.dataset.space=space;$('context').textContent=space==='teacher'?'Mi espacio docente':'Mi espacio estudiante';
  if(user&&!profile){$('main').innerHTML='<h1>Cargando tu espacio…</h1>';return}
  if(!user){$('main').innerHTML='<p class="eyebrow">MATEMÁTICA A PEDAL</p><h1>Tu recorrido, acompañado.</h1><p>Iniciá sesión para consultar tu avance o preparar un grupo docente.</p><section class="panel"><div class="panel-body">'+button('Iniciar sesión con Google','login')+'<p class="small muted" style="margin-top:15px">En este entorno se utiliza el simulador local de cuentas de Firebase.</p></div></section>';return}
  let content='';
  if(page==='activate')content=`<h1>Quiero enseñar</h1><section class="panel"><div class="panel-body"><p>Creá tus grupos sin solicitar aprobación por correo. Solo verás avances de estudiantes que acepten compartirlos con vos.</p><form id="activate" class="aula-form"><label for="teacher-name">Tu nombre visible en las invitaciones</label><input id="teacher-name" class="full-input" value="${escape(user.displayName||'')}" maxlength="60" required><div class="row"><button class="btn">Activar mi espacio docente</button></div></form><p class="notice" style="margin-top:22px">Activar esta función no acredita vinculación oficial con UTEC. Podés seguir aprendiendo con la misma cuenta.</p></div></section>`;
  else if(page==='groups')content=`<div class="page-head"><div><h1>Mis grupos</h1><p class="muted">Organizá tus cursos y acompañá sus recorridos.</p></div>${button('Crear grupo','new')}</div><div class="groups">${groups.length?groups.map(g=>`<section class="group-card"><p class="eyebrow">${g.status==='active'?'GRUPO ACTIVO':'ARCHIVADO'}</p><h2>${escape(g.name)}</h2><p>${g.status==='archived'?'Seguimiento terminado':g.memberCount+' integrantes'}</p><div class="row"><button class="btn" data-open-group="${g.id}">${g.status==='active'?'Ver avances':'Ver grupo archivado'}</button></div></section>`).join(''):'<section class="panel"><div class="panel-body"><h2>Tu primer grupo empieza acá</h2><p>Crealo y compartí una invitación. Cada estudiante decide si ingresa.</p></div></section>'}</div>`;
  else if(page==='new')content=`<h1>Crear un grupo</h1><section class="panel"><div class="panel-body"><form id="new-group-form" class="aula-form"><label for="group-name">Nombre del grupo</label><input id="group-name" class="full-input" required maxlength="70" placeholder="Matemática I · Grupo A"><p class="small muted" style="margin-top:12px">El grupo comienza vacío. Nadie se incorpora sin aceptar compartir sus avances.</p><div class="row"><button class="btn">Crear grupo</button>${button('Cancelar','groups',true)}</div></form></div></section>`;
  else if(page==='invite')content=`<h1>Tu invitación</h1><section class="panel"><div class="panel-body"><h2>${escape(group()?.name)}</h2><p>Compartí este código con tus estudiantes.</p><p class="aula-code">${escape(invitation?.code?.match(/.{1,4}/g)?.join('-'))}</p><p class="small muted">Vence el ${fmt(invitation?.expiresAt)}. El código solo se muestra al crearlo o renovarlo; no lo guardamos en el navegador.</p><div class="row">${button('Copiar código','copy')}${button('Ver grupo','group',true)}</div></div></section>`;
  else if(page==='group'||page==='manage')content=teacherGroup();
  else if(page==='detail')content=studentDetail();
  else if(page==='join')content=joinScreen();
  else if(page==='memberships')content=`<div class="page-head"><h1>Mis grupos</h1>${button('Unirme a un grupo','join')}</div>${membershipCards()}`;
  else content=learnerScreen();
  $('main').innerHTML=content;disableButtons(busy);
}
function teacherGroup(){const g=group();if(!g)return `<h1>Tu espacio docente está listo</h1><p>Creá un grupo para comenzar.</p>${button('Crear grupo','new')}`;
  const heading=groupSelector()+`<div class="page-head"><div><p class="eyebrow">${g.status==='active'?'GRUPO ACTIVO':'GRUPO ARCHIVADO'}</p><h1>${escape(g.name)}</h1></div>${page==='group'?button('Administrar grupo','manage',true):button('Ver avances','group',true)}</div>`;
  if(g.status!=='active')return heading+'<section class="panel"><div class="panel-body"><h2>El seguimiento terminó</h2><p>La invitación está desactivada y ya no se muestran avances. Las cuentas y el progreso personal se conservan.</p></div></section>';
  if(page==='manage')return heading+confirmScreen()+`<div class="two-col"><section class="panel"><div class="panel-body"><h2>Nombre del grupo</h2><form id="rename" class="aula-form"><label for="rename-name">Nombre visible para sus integrantes</label><input id="rename-name" class="full-input" value="${escape(g.name)}" required maxlength="70"><div class="row"><button class="btn">Guardar nombre</button></div></form></div></section><section class="panel"><div class="panel-body"><h2>Invitaciones</h2><p>Renovar el código invalida el anterior y conserva los integrantes actuales.</p>${button('Generar nueva invitación','confirm-rotate',true)}</div></section></div><section class="panel"><div class="panel-body"><h2>Archivar grupo</h2><p>Termina el acceso a todos los avances desde este grupo. No borra el progreso personal de sus estudiantes.</p>${button('Archivar grupo','confirm-archive',true)}</div></section><p class="small muted">Para quitar un integrante, abrí su detalle desde “Ver avances”.</p>`;
  const withData=rows.filter(r=>r.units.some(u=>u.completed!==null));
  const mean=withData.length?Math.round(withData.reduce((a,r)=>a+r.units.reduce((s,u)=>s+(u.completed||0),0)/r.units.reduce((s,u)=>s+u.total,0),0)/withData.length*100):null;
  return heading+`<div class="cards"><div class="card"><div class="small muted">Integrantes del grupo</div><div class="metric">${g.memberCount}</div></div><div class="card"><div class="small muted">Recorrido · página actual</div><div class="metric">${mean===null?'—':mean+'%'}</div><p class="small muted">Promedio entre ${withData.length} integrantes con datos de esta página.</p></div><div class="card"><div class="small muted">En esta página</div><div class="metric">${rows.length}</div></div></div><section class="panel"><div class="panel-head"><h2>Avances compartidos</h2>${button('Actualizar','reload',true)}</div><div class="table-wrap"><table><caption class="sr">Páginas completadas por estudiante y unidad</caption><thead><tr><th>Estudiante</th>${profile.catalog.map((u,i)=>`<th>Unidad ${i}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td><button class="student-link" data-student-id="${r.uid}">${escape(r.alias)}</button></td>${r.units.map(u=>`<td>${progress(u)}</td>`).join('')}</tr>`).join(''):'<tr><td colspan="6" class="empty">Todavía no hay integrantes en esta página.</td></tr>'}</tbody></table></div><div class="pagination">${history.length?button('Anterior','previous',true):'<span></span>'}${nextCursor?button('Siguiente','next',true):''}</div><p class="caption-note">Sin datos puede significar falta de sincronización. Completar páginas no demuestra dominio del contenido.</p></section>`;
}
function studentDetail(){const row=rows.find(r=>r.uid===selectedStudent);if(!row)return '<h1>Detalle no disponible</h1><p>Actualizá el grupo para volver a consultarlo.</p>'+button('Ver grupo','group',true);
  return `<div class="crumb">${button('Volver al grupo','group',true)}</div><h1>${escape(row.alias)}</h1><p class="muted">${escape(group()?.name)} · Se muestran avances anteriores y posteriores al ingreso.</p>${confirmScreen()}${unitCards(row.units)}<section class="panel"><div class="panel-body"><h2>Terminar el acceso desde este grupo</h2><p>Quitar al integrante conserva su cuenta y progreso. Puede volver a ingresar si tiene una invitación vigente y acepta nuevamente.</p>${button('Quitar del grupo','confirm-remove',true)}</div></section>`;
}
function unitCards(units){return units.map((u,index)=>`<section class="panel"><div class="panel-head"><div><h2>${escape(u.title)}</h2><p class="small muted" style="margin:0">${progress(u)}${u.legacy?' · Registro antiguo, pendiente de migración':''}</p></div></div><div class="panel-body">${u.completed===null?'<p class="muted">Sin datos sincronizados disponibles. Esto no significa que no haya estudiado.</p>':`<div class="progress"><i style="width:${u.completed/u.total*100}%"></i></div><details><summary>Ver páginas de esta unidad</summary><ul class="activity-list">${profile.catalog[index].pages.map(p=>`<li><span>${escape(p.title)}</span><span class="tag ${u.pages.includes(p.id)?'':'pending'}">${u.pages.includes(p.id)?'Completada':'Pendiente'}</span></li>`).join('')}</ul></details>`}</div></section>`).join('')}
function membershipCards(){return memberships.length?memberships.map(g=>`<section class="panel"><div class="panel-body"><h2>${escape(g.name)}</h2><p class="muted">${escape(g.teacherName)}</p><p>Compartís nombre y registros de progreso, con páginas, fechas y metadatos de actividad disponibles, de las unidades del recorrido, incluido tu progreso anterior al ingreso.</p><button class="btn secondary" data-leave-group="${g.id}">Salir y dejar de compartir</button></div></section>`).join(''):'<section class="panel"><div class="panel-body"><p>No estás compartiendo avances con ningún grupo.</p></div></section>'}
function learnerScreen(){const total=myUnits.reduce((a,u)=>a+u.total,0),done=myUnits.reduce((a,u)=>a+(u.completed||0),0);return `<p class="eyebrow">MI RECORRIDO</p><h1>Cada paso cuenta.</h1><section class="hero"><div><h2>Tu avance personal</h2><p>El recorrido se conserva aunque salgas de un grupo.</p></div><div class="route">${myUnits.some(u=>u.completed!==null)?done:'—'} <small>de ${total} páginas</small></div></section><p class="inline-notice">Las actividades originales todavía usan su configuración existente. Este panel de pruebas no abre ni copia automáticamente avances de producción o del navegador.</p>${unitCards(myUnits)}<h2>Con quién comparto mis avances</h2>${confirmScreen()}${membershipCards()}${profile.teacherEnabled?'':`<p style="margin-top:24px">¿También acompañás un curso?</p>${button('Quiero enseñar','activate',true)}`}`}
function joinScreen(){if(preview)return `<h1>Revisá tu invitación</h1><section class="panel"><div class="panel-body aula-form"><p class="eyebrow">TE INVITARON A</p><h2>${escape(preview.name)}</h2><p>Docente: ${escape(preview.teacherName)}</p>${preview.alreadyJoined?'<p>Ya sos integrante de este grupo.</p>'+button('Ver mis grupos','memberships'): `<div class="notice"><strong>Qué compartirás</strong><p>Tu nombre y los registros de progreso de las unidades 0 a 4: páginas, fechas y metadatos de actividad disponibles, como tiempo activo y desplazamiento si están guardados. Incluye tus avances anteriores al ingreso y los futuros.</p><p>Podés salir cuando quieras desde “Mis grupos”. Conservás tu cuenta y tu progreso; no podemos retirar información que el docente ya haya visto o copiado.</p></div><form id="consent"><label for="alias">Nombre que verá el docente</label><input id="alias" class="full-input" required maxlength="60" value="${escape(user.displayName||'')}"><label class="check"><input id="consent-check" type="checkbox" required><span>Quiero incorporarme a ${escape(preview.name)} y compartir con ${escape(preview.teacherName)} los avances indicados.</span></label><div class="row"><button class="btn">Aceptar e ingresar</button>${button('Ahora no','cancel-join',true)}</div></form>`}</div></section>`;
  return `<h1>Unirme a un grupo</h1><section class="panel"><div class="panel-body"><form id="lookup" class="aula-form"><label for="invite-code">Código de invitación</label><input id="invite-code" class="full-input" required maxlength="40" autocomplete="off" spellcheck="false"><p class="small muted" style="margin-top:12px">Consultar el código todavía no te incorpora al grupo.</p><div class="row"><button class="btn">Consultar grupo</button></div></form></div></section>`;
}
function confirmScreen(){if(!confirmation)return '';
  const copy={rotate:['¿Renovar la invitación?','El código anterior dejará de funcionar. Los integrantes actuales permanecen.'],archive:['¿Archivar el grupo?','Se desactiva la invitación y termina el acceso a todos los avances. Se conserva el progreso personal.'],remove:['¿Quitar a este integrante?','Termina el acceso a sus avances desde este grupo. Su cuenta y su progreso personal se conservan.'],leave:['¿Salir y dejar de compartir?','El docente dejará de recibir acceso desde este grupo. Tu progreso personal se conserva. No se retira información ya vista o copiada.']}[confirmation.type];return `<section class="confirm-panel" aria-label="Confirmar acción"><h2>${copy[0]}</h2><p>${copy[1]}</p><div class="row">${button('Cancelar','cancel-confirm',true)}${button('Confirmar','execute-confirm')}</div></section>`;
}
function disableButtons(value){document.querySelectorAll('main button,aside button,header button,main input,main select,aside select').forEach(el=>el.disabled=value);$('main').setAttribute('aria-busy',String(value))}
async function perform(fn){if(busy)return;busy=true;disableButtons(true);const captured=epoch;try{await fn();if(captured===epoch)render()}catch(error){if(captured===epoch)tell(error.message||'No se pudo completar. Reintentá.')}finally{if(captured===epoch){busy=false;disableButtons(false)}}}
async function navigate(next){preview=null;confirmation=null;selectedStudent=null;if(next==='new')createRequestId=crypto.randomUUID();if(next!=='group'){cursor=null;history=[]}page=next;await refresh()}
document.addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;const action=b.dataset.action;
  perform(async()=>{
    if(b.dataset.page){await navigate(b.dataset.page);return}
    if(b.dataset.openGroup){selected=b.dataset.openGroup;cursor=null;history=[];page='group';await refresh();return}
    if(b.dataset.studentId){selectedStudent=b.dataset.studentId;page='detail';return}
    if(b.dataset.leaveGroup){confirmation={type:'leave',groupId:b.dataset.leaveGroup};page='learner';return}
    switch(action){
      case 'login':await api.login();break;
      case 'groups':case 'group':case 'manage':case 'new':case 'join':case 'memberships':case 'activate':await navigate(action);break;
      case 'reload':await refresh();break;
      case 'copy':await navigator.clipboard.writeText(invitation.code.match(/.{1,4}/g).join('-'));tell('Código copiado.');break;
      case 'cancel-join':preview=null;await navigate('learner');tell('No te incorporaste a un grupo nuevo.');break;
      case 'confirm-rotate':confirmation={type:'rotate',groupId:selected};break;
      case 'confirm-archive':confirmation={type:'archive',groupId:selected};break;
      case 'confirm-remove':confirmation={type:'remove',groupId:selected,memberUid:selectedStudent};break;
      case 'cancel-confirm':confirmation=null;break;
      case 'execute-confirm':{
        const target=confirmation;if(!target)return;
        if(target.type==='rotate'){invitation=await request('rotateInvite',{groupId:target.groupId});page='invite'}
        if(target.type==='archive'){await request('archiveGroup',{groupId:target.groupId});rows=[];page='manage'}
        if(target.type==='remove'){await request('removeMember',target);rows=[];page='group'}
        if(target.type==='leave'){await request('leaveGroup',{groupId:target.groupId});page='learner'}
        confirmation=null;await refresh();tell('Cambio guardado.');break;
      }
      case 'next':history.push(cursor);cursor=nextCursor;await refresh();break;
      case 'previous':cursor=history.pop()??null;await refresh();break;
    }
  });
});
document.addEventListener('change',event=>{
  if(event.target.id==='space-select')perform(async()=>{space=event.target.value;page=space==='teacher'?'groups':'learner';rows=[];preview=null;confirmation=null;cursor=null;history=[];await refresh()});
  if(event.target.id==='group-select')perform(async()=>{selected=event.target.value;rows=[];confirmation=null;cursor=null;history=[];await refresh()});
});
document.addEventListener('submit',event=>{event.preventDefault();const id=event.target.id;
  const input=Object.fromEntries([...event.target.querySelectorAll('input')].map(el=>[el.id,el.type==='checkbox'?el.checked:el.value]));
  perform(async()=>{
    if(id==='activate'){await request('activateTeacher',{name:input['teacher-name']});profile=await request('getProfile');space='teacher';page='new';await refresh()}
    if(id==='new-group-form'){createRequestId??=crypto.randomUUID();const result=await request('createGroup',{name:input['group-name'],requestId:createRequestId});selected=result.group.id;invitation=result;page=result.alreadyCreated?'manage':'invite';await refresh();if(result.alreadyCreated)tell('El grupo ya estaba creado. Podés generar una nueva invitación desde acá.')}
    if(id==='rename'){await request('renameGroup',{groupId:selected,name:input['rename-name']});await refresh();tell('Nombre actualizado.')}
    if(id==='lookup'){preview=await request('previewInvite',{code:input['invite-code']});invitation={code:input['invite-code']}}
    if(id==='consent'){await request('joinGroup',{code:invitation.code,alias:input.alias,consent:input['consent-check'],consentVersion:preview.consentVersion});preview=null;invitation=null;await navigate('memberships');tell('Ya sos parte del grupo. Podés dejar de compartir desde acá.')}
  });
});
async function start(){try{
  assertTestEnvironment(location);api=(await import('./firebase.mjs')).api;
  $('logout').onclick=()=>perform(async()=>{await api.logout()});
  api.observe(async current=>{
    const captured=++epoch;busy=false;clearSession();user=current;render();
    if(current){busy=true;disableButtons(true);try{profile=await request('getProfile');if(captured!==epoch)return;await refresh();if(captured===epoch)render()}catch(error){if(captured===epoch){tell(error.message);$('main').innerHTML='<h1>No pudimos cargar tu espacio</h1><p>Comprobá que los servicios locales estén en marcha. Podés cerrar sesión y reintentar.</p>'}}finally{if(captured===epoch){busy=false;disableButtons(false)}}}
  });
}catch(error){$('main').innerHTML='<h1>Versión de pruebas</h1><p>'+escape(error.message)+'</p>';}}
start();

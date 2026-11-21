// El cliente organiza operaciones; firestore.spark.rules es la frontera de autorización.
export const CONSENT_VERSION=1;
export function normalizeCode(value){const code=String(value||'').toUpperCase().replace(/[\s-]/g,'');if(!/^[A-F0-9]{32}$/.test(code))throw Error('Código no válido. Revisá la invitación.');return code}
export function summarize(documents,catalog){return catalog.map(unit=>{const data=documents[unit.id],raw=data?.completedPages,pages=Array.isArray(raw)?unit.pages.filter(p=>raw.includes(p.id)).map(p=>p.id):null;return {id:unit.id,title:unit.title,total:unit.pages.length,completed:pages?.length??null,pages,legacy:!!data&&!Array.isArray(raw)&&Array.isArray(data.checked),completionDates:pages?pages.map(id=>data.completionMeta?.[id]?.completedAt).filter(Number.isFinite):[],updatedAt:Number.isFinite(data?.updatedAt)?data.updatedAt:null}})}
const name=(value,size)=>{if(typeof value!=='string'||!value.trim()||value.trim().length>size)throw Error('Revisá el nombre ingresado.');return value.trim()};
const id=value=>{if(typeof value!=='string'||!/^[-_a-zA-Z0-9]{1,128}$/.test(value))throw Error('Identificador no válido.');return value};
export function createSparkClient(store,{catalog,currentUser,randomCode=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('').toUpperCase(),now=()=>Date.now()}={}){
  const gp=gid=>'sparkGroups/'+id(gid),mp=(gid,uid)=>gp(gid)+'/members/'+uid,ip=(uid,gid)=>`sparkMemberships/${uid}/groups/${gid}`;
  const publicGroup=g=>({id:g.id,name:g.name,teacherName:g.teacherName,status:g.status,memberCount:g.memberCount??0,createdAt:g.createdAt?.toMillis?.()??null});
  async function owned(uid,gid){const g=await store.get(gp(gid));if(!g||g.ownerId!==uid)throw Error('No tenés acceso a este grupo.');return g}
  async function count(g){if(g.status!=='active')return 0;const n=await store.count(gp(g.id)+'/members',201);return n===201?'201+':n}
  function inviteData(g){return {groupId:g.id,name:g.name,teacherName:g.teacherName,ownerId:g.ownerId,expiresAt:g.expiresAt}}
  return {async call(action,data={}){
    const user=currentUser();if(!user||user.isAnonymous)throw Error('Iniciá sesión con Google.');const uid=id(user.uid),profilePath='sparkProfiles/'+uid;
    if(action==='getProfile'){const p=await store.get(profilePath);return {teacherEnabled:p?.teacherEnabled===true&&!p?.suspended,catalog,consentVersion:1}}
    if(action==='activateTeacher'){const p=await store.get(profilePath);await store.set(profilePath,p?{name:name(data.name,60)}:{name:name(data.name,60),teacherEnabled:true,createdAt:store.timestamp()},{merge:!!p});return {teacherEnabled:true}}
    if(action==='createGroup'){
      const gid=id(data.requestId),code=randomCode(),expiresAt=store.date(now()+7*86400000-60000);
      return store.transaction(async tx=>{
        const profile=await tx.get(profilePath);if(!profile?.teacherEnabled||profile.suspended)throw Error('Activá tu espacio docente.');
        // El ID depende del UID, así un reintento no duplica ni pisa otro docente.
        const groupId=await store.digest(uid+':'+gid),path=gp(groupId),prior=await tx.get(path);
        if(prior)return {group:publicGroup(prior),alreadyCreated:true};
        const collision=await tx.get('sparkInvites/'+code);if(collision)throw Error('Reintentá crear la invitación.');
        const group={id:groupId,name:name(data.name,70),ownerId:uid,teacherName:profile.name,status:'active',createdAt:store.timestamp(),code,expiresAt};
        const {id:ignored,...record}=group;tx.set(path,record);tx.set('sparkInvites/'+code,inviteData(group));return {group:publicGroup(group),code,expiresAt:expiresAt.toMillis()};
      });
    }
    if(action==='listTeacherGroups'){
      const rows=await store.list('sparkGroups',{field:'ownerId',value:uid,after:data.cursor,limit:21});
      const groups=await Promise.all(rows.slice(0,20).map(async g=>({...publicGroup(g),memberCount:await count(g)})));
      return {groups,nextCursor:rows.length>20?rows[19].id:null};
    }
    if(['renameGroup','rotateInvite','archiveGroup'].includes(action)){
      return store.transaction(async tx=>{
        const path=gp(data.groupId),g=await tx.get(path);if(!g||g.ownerId!==uid||g.status!=='active')throw Error('Grupo no disponible.');
        if(action==='renameGroup'){const updated={...g,name:name(data.name,70)};tx.update(path,{name:updated.name});tx.set('sparkInvites/'+g.code,inviteData(updated));return {group:publicGroup(updated)}}
        if(action==='archiveGroup'){tx.update(path,{status:'archived',archivedAt:store.timestamp()});return {archived:true}}
        const code=randomCode(),expiresAt=store.date(now()+7*86400000-60000);
        const collision=await tx.get('sparkInvites/'+code);if(collision)throw Error('Reintentá renovar el código.');
        tx.update(path,{code,expiresAt});tx.set('sparkInvites/'+code,inviteData({...g,code,expiresAt}));
        // El código anterior queda inutilizable por las reglas, sin requerir borrado.
        return {code,expiresAt:expiresAt.toMillis()};
      });
    }
    if(action==='previewInvite'){
      let invite;try{invite=await store.get('sparkInvites/'+normalizeCode(data.code))}catch{throw Error('Invitación no disponible o vencida. Pedile un código vigente a tu docente.')}
      if(!invite||invite.expiresAt.toMillis()<=now())throw Error('Invitación no disponible o vencida.');
      const member=await store.get(mp(invite.groupId,uid));return {id:invite.groupId,name:invite.name,teacherName:invite.teacherName,alreadyJoined:!!member,consentVersion:1};
    }
    if(action==='joinGroup'){
      if(data.consent!==true||data.consentVersion!==1)throw Error('Revisá y aceptá compartir tus avances.');
      const code=normalizeCode(data.code),invite=await store.get('sparkInvites/'+code);
      if(!invite||invite.expiresAt.toMillis()<=now())throw Error('Invitación no disponible.');
      return store.transaction(async tx=>{
        // El estudiante no lee el grupo antes de inscribirse; las reglas revalidan
        // el código actual, estado y vencimiento en el instante de la escritura.
        const member=await tx.get(mp(invite.groupId,uid));if(member)return {joined:true};
        tx.set(mp(invite.groupId,uid),{uid,alias:name(data.alias,60),joinedAt:store.timestamp(),consentVersion:1,sharePriorProgress:true,inviteCode:code});
        tx.set(ip(uid,invite.groupId),{groupId:invite.groupId});
        return {joined:true};
      });
    }
    if(action==='listMemberships'){
      const indexes=[];let after=null;
      do{const batch=await store.list(`sparkMemberships/${uid}/groups`,{limit:21,after});indexes.push(...batch.slice(0,20));after=batch.length>20?batch[19].id:null}while(after);
      const groups=[];for(const entry of indexes){try{const g=await store.get(gp(entry.groupId));if(g?.status==='active')groups.push(publicGroup(g))}catch(error){if(error.code!=='permission-denied')throw error}}
      return {groups};
    }
    if(action==='leaveGroup'||action==='removeMember'){
      const gid=id(data.groupId),target=action==='leaveGroup'?uid:id(data.memberUid);
      if(action==='removeMember')await owned(uid,gid);
      await store.transaction(async tx=>{tx.delete(mp(gid,target));tx.delete(ip(target,gid))});return {left:true};
    }
    if(action==='getMyProgress'){const docs={};for(const u of catalog)docs[u.id]=await store.get(`users/${uid}/progress/${u.id}`);return {units:summarize(docs,catalog),asOf:now()}}
    if(action==='getGroupProgress'){
      const g=await owned(uid,data.groupId);if(g.status!=='active')throw Error('El grupo está archivado.');
      const members=await store.list(gp(g.id)+'/members',{limit:21,after:data.cursor}),students=[];
      for(const member of members.slice(0,20)){
        const path=`sparkShares/${member.uid}/teachers/${uid}`,share=await store.get(path);
        if(share?.groupId!==g.id)await store.set(path,{groupId:g.id});
        const docs={};for(const u of catalog)docs[u.id]=await store.get(`users/${member.uid}/progress/${u.id}`);
        students.push({uid:member.uid,alias:member.alias,units:summarize(docs,catalog)});
      }
      // Revalidar el grupo y roster tras las lecturas para no presentar un resultado
      // que terminó de cargarse después de una retirada o un archivo.
      const fresh=await owned(uid,g.id);if(fresh.status!=='active')throw Error('El seguimiento terminó.');
      for(const row of students)if(!await store.get(mp(g.id,row.uid)))throw Error('Los integrantes cambiaron. Actualizá el grupo.');
      return {group:{...publicGroup(g),memberCount:await count(g)},students,nextCursor:members.length>20?members[19].id:null,asOf:now()};
    }
    throw Error('Esta función no está disponible en la versión Spark.');
  }};
}

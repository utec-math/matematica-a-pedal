import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createSparkClient,normalizeCode,summarize} from '../client.mjs';
import {catalog} from '../../aula/catalog.mjs';
function setup(){
  const records=new Map();let uid='teacher',sequence=0;const date=ms=>({toMillis:()=>ms});
  const get=async p=>records.has(p)?{...records.get(p),id:p.split('/').pop()}:null;
  const store={get,timestamp:()=>date(1000),date,digest:async text=>createHash('sha256').update(text).digest('hex'),
    set:async(p,v,options)=>records.set(p,options?.merge?{...records.get(p),...v}:v),
    list:async(p,{field,value,after,limit=21}={})=>[...records].filter(([k,v])=>k.startsWith(p+'/')&&!k.slice(p.length+1).includes('/')&&(!field||v[field]===value)&&(!after||k.split('/').pop()>after)).sort(([a],[b])=>a.localeCompare(b)).slice(0,limit).map(([k,v])=>({...v,id:k.split('/').pop()})),
    count:async(p,limit)=>(await store.list(p,{limit})).length,
    transaction:async fn=>{let writes=false;const pending=[];const result=await fn({get:p=>{assert.equal(writes,false);return get(p)},set:(p,v)=>{writes=true;pending.push(()=>records.set(p,v))},update:(p,v)=>{writes=true;pending.push(()=>records.set(p,{...records.get(p),...v}))},delete:p=>{writes=true;pending.push(()=>records.delete(p))}});pending.forEach(f=>f());return result;}
  };
  const client=createSparkClient(store,{catalog,currentUser:()=>uid?{uid}:null,now:()=>1000,randomCode:()=>String(++sequence).padStart(32,'0')});
  const create=async()=>{await client.call('activateTeacher',{name:'Docente'});return client.call('createGroup',{requestId:'r',name:'Curso'})};
  const as=value=>uid=value;
  const join=code=>client.call('joinGroup',{code,alias:'Ana',consent:true,consentVersion:1});
  return {client,records,create,as,join};
}
test('catálogo del panel coincide con la navegación',()=>{const nav=JSON.parse(readFileSync(new URL('../../assets/nav.json',import.meta.url)));assert.deepEqual(catalog.map(u=>u.pages.length),nav.unidades.map(u=>u.bloques.length));assert.equal(catalog.reduce((n,u)=>n+u.pages.length,0),38)});
test('códigos son secretos de 128 bits con formato tolerante a guiones',()=>{assert.equal(normalizeCode('abcd-abcd-abcd-abcd-abcd-abcd-abcd-abcd'),'ABCD'.repeat(8));assert.throws(()=>normalizeCode('corto'))});
test('crear y reintentar no duplica grupos',async()=>{const {create,records}=setup();const a=await create(),b=await create();assert.equal(a.group.id,b.group.id);assert.equal(b.alreadyCreated,true);assert.equal([...records.keys()].filter(k=>k.startsWith('sparkGroups/')).length,1)});
test('la creación de grupo requiere activación docente',async()=>{const {client}=setup();await assert.rejects(client.call('createGroup',{requestId:'r',name:'Curso'}),/Activá/)});
test('consulta de invitación no incorpora al estudiante',async()=>{const {create,as,client,records}=setup();const {code}=await create();as('student');const info=await client.call('previewInvite',{code});assert.equal(info.name,'Curso');assert.equal(info.alreadyJoined,false);assert.equal([...records.keys()].some(k=>k.includes('/members/')),false)});
test('ingreso registra consentimiento y secreto vigente en una sola operación',async()=>{const {create,as,join,records}=setup();const {code,group}=await create();as('student');await join(code);const member=records.get(`sparkGroups/${group.id}/members/student`);assert.equal(member.consentVersion,1);assert.equal(member.sharePriorProgress,true);assert.equal(member.inviteCode,code);assert.ok(records.has(`sparkMemberships/student/groups/${group.id}`))});
test('sin consentimiento no escribe membresías',async()=>{const {client,create,as}=setup();const {code}=await create();as('student');await assert.rejects(client.call('joinGroup',{code,alias:'Ana',consent:false,consentVersion:1}),/aceptá/)});
test('duplicados no reinician el consentimiento',async()=>{const {create,as,join,records}=setup();const {code,group}=await create();as('student');await join(code);const prior=records.get(`sparkGroups/${group.id}/members/student`);await join(code);assert.equal(records.get(`sparkGroups/${group.id}/members/student`),prior)});
test('renombrar mantiene sincronizada la vista previa',async()=>{const {client,create,records}=setup();const {code,group}=await create();await client.call('renameGroup',{groupId:group.id,name:'Nuevo'});assert.equal(records.get(`sparkInvites/${code}`).name,'Nuevo')});
test('renovar modifica código del grupo, no sus integrantes',async()=>{const {client,create,as,join,records}=setup();const {code,group}=await create();as('student');await join(code);as('teacher');const fresh=await client.call('rotateInvite',{groupId:group.id});assert.notEqual(code,fresh.code);assert.equal(records.get(`sparkGroups/${group.id}`).code,fresh.code);assert.ok(records.has(`sparkGroups/${group.id}/members/student`))});
test('salir retira membresía e índice sin borrar progreso',async()=>{const {client,create,as,join,records}=setup();const {code,group}=await create();as('student');await join(code);records.set('users/student/progress/unidad0',{completedPages:[]});await client.call('leaveGroup',{groupId:group.id});assert.ok(records.has('users/student/progress/unidad0'));assert.equal(records.has(`sparkGroups/${group.id}/members/student`),false);assert.equal(records.has(`sparkMemberships/student/groups/${group.id}`),false)});
test('archivo conserva registros pero el cliente deja de consultar avances',async()=>{const {client,create,as,join,records}=setup();const {code,group}=await create();as('student');await join(code);as('teacher');await client.call('archiveGroup',{groupId:group.id});await assert.rejects(client.call('getGroupProgress',{groupId:group.id}),/archivado/);assert.ok(records.has(`sparkGroups/${group.id}/members/student`))});
test('panel conecta el permiso a un grupo antes de consultar progreso',async()=>{const {client,create,as,join,records}=setup();const {code,group}=await create();as('student');await join(code);records.set('users/student/progress/unidad0',{completedPages:['introduccion','introduccion','falso']});as('teacher');const result=await client.call('getGroupProgress',{groupId:group.id});assert.equal(records.get('sparkShares/student/teachers/teacher').groupId,group.id);assert.equal(result.students[0].units[0].completed,1)});
test('cero, registros antiguos y falta de datos son distintos',()=>{const u=summarize({unidad0:{completedPages:[]},unidad1:{checked:['a']}},catalog);assert.equal(u[0].completed,0);assert.equal(u[1].completed,null);assert.equal(u[1].legacy,true);assert.equal(u[2].completed,null)});
test('cliente no depende de funciones ni librerías de servidor',()=>{const src=readFileSync(new URL('../../aula/firebase.mjs',import.meta.url),'utf8');assert.ok(!/httpsCallable|getFunctions|firebase-functions|firebase-admin/.test(src));const config=JSON.parse(readFileSync(new URL('../../firebase.spark.json',import.meta.url)));assert.equal(config.functions,undefined)});

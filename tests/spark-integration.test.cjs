const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');
const sdk=require('firebase/firestore');
let env,createSparkClient,firestoreStore,catalog;
test.before(async()=>{
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST,'Solo emulador');
  ({createSparkClient}=await import('../spark/client.mjs'));({firestoreStore}=await import('../spark/firestore-store.mjs'));({catalog}=await import('../aula/catalog.mjs'));
  env=await initializeTestEnvironment({projectId:'demo-matematica-pedal',firestore:{rules:fs.readFileSync('firestore.spark.rules','utf8')}});
});
test.after(async()=>env?.cleanup());
function account(uid){const db=env.authenticatedContext(uid,{email_verified:true,firebase:{sign_in_provider:'google.com'}}).firestore();return {db,api:createSparkClient(firestoreStore(db,sdk),{catalog,currentUser:()=>({uid})})}}
test('recorrido integrado: activar, crear, consultar, consentir, ver progreso, renovar y salir',async()=>{
  await env.clearFirestore();const t=account('teacher'),s=account('student'),other=account('other');
  await t.api.call('activateTeacher',{name:'Docente'});
  const created=await t.api.call('createGroup',{name:'Matemática',requestId:'primero'});
  const gid=created.group.id,code=created.code;
  const list=await t.api.call('listTeacherGroups');assert.equal(list.groups[0].memberCount,0);
  const preview=await s.api.call('previewInvite',{code});assert.equal(preview.alreadyJoined,false);
  await assert.rejects(s.api.call('joinGroup',{code,alias:'Ana',consent:false,consentVersion:1}));
  await s.api.call('joinGroup',{code,alias:'Ana',consent:true,consentVersion:1});
  await sdk.setDoc(sdk.doc(s.db,'users/student/progress/unidad0'),{completedPages:['introduccion'],completionMeta:{introduccion:{completedAt:Date.now()}}});
  assert.equal((await s.api.call('listMemberships')).groups.length,1);
  const progress=await t.api.call('getGroupProgress',{groupId:gid});assert.equal(progress.students[0].units[0].completed,1);
  await other.api.call('activateTeacher',{name:'Otro'});await assert.rejects(other.api.call('getGroupProgress',{groupId:gid}));
  await t.api.call('renameGroup',{groupId:gid,name:'Nuevo nombre'});assert.equal((await s.api.call('previewInvite',{code})).name,'Nuevo nombre');
  const rotated=await t.api.call('rotateInvite',{groupId:gid});await assert.rejects(s.api.call('previewInvite',{code}));
  assert.equal((await t.api.call('getGroupProgress',{groupId:gid})).students.length,1);
  await s.api.call('leaveGroup',{groupId:gid});assert.equal((await s.api.call('listMemberships')).groups.length,0);
  await assert.rejects(sdk.getDocFromServer(sdk.doc(t.db,'users/student/progress/unidad0')));
  assert.equal((await s.api.call('getMyProgress')).units[0].completed,1);
  await s.api.call('joinGroup',{code:rotated.code,alias:'Ana',consent:true,consentVersion:1});
  await t.api.call('removeMember',{groupId:gid,memberUid:'student'});assert.equal((await t.api.call('getGroupProgress',{groupId:gid})).students.length,0);
});
test('dos grupos de un docente: retirar de uno conserva solo el consentimiento del otro',async()=>{
  await env.clearFirestore();const t=account('teacher'),s=account('student');await t.api.call('activateTeacher',{name:'Docente'});
  const a=await t.api.call('createGroup',{name:'A',requestId:'a'}),b=await t.api.call('createGroup',{name:'B',requestId:'b'});
  for(const c of [a,b])await s.api.call('joinGroup',{code:c.code,alias:'Ana',consent:true,consentVersion:1});
  await sdk.setDoc(sdk.doc(s.db,'users/student/progress/unidad0'),{completedPages:[]});
  await t.api.call('getGroupProgress',{groupId:a.group.id});await s.api.call('leaveGroup',{groupId:a.group.id});
  assert.equal((await t.api.call('getGroupProgress',{groupId:b.group.id})).students.length,1);
  await t.api.call('archiveGroup',{groupId:b.group.id});
  await assert.rejects(t.api.call('getGroupProgress',{groupId:b.group.id}));
  await assert.rejects(sdk.getDocFromServer(sdk.doc(t.db,'users/student/progress/unidad0')));
  assert.equal((await s.api.call('listMemberships')).groups.length,0);
});

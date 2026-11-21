const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const catalog=require('../../functions/catalog.json');
function setup(){
  const elements=new Map();
  const el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',hidden:false,setAttribute(){},focus(){}});return elements.get(id)};
  const ctx=vm.createContext({document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){},body:{dataset:{}}},setTimeout:()=>0,clearTimeout(){},crypto:{randomUUID:()=> 'id'},location:{hostname:'localhost'},Date,console,assertTestEnvironment(){}});
  const source=fs.readFileSync(require.resolve('../app.mjs'),'utf8').replace(/^import .*\n/,'').replace(/start\(\);\s*$/,'');
  vm.runInContext(source,ctx);const run=code=>vm.runInContext(code,ctx);
  ctx.catalog=catalog;
  return {el,run,ctx};
}
test('la transición de autenticación no muestra datos de la sesión anterior',()=>{
  const {run,el}=setup();run("user={displayName:'Prueba'};profile=null;render()");assert.ok(el('main').innerHTML.includes('Cargando'));run('clearSession();render()');assert.ok(el('main').innerHTML.includes('Iniciar sesión'));assert.equal(el('identity').textContent,'Tu cuenta');
});
test('menús de estudiante y docente permanecen separados',()=>{
  const {run,el}=setup();run("user={displayName:'Prueba'};profile={teacherEnabled:true,catalog};space='student';nav()");assert.ok(!el('navigation').innerHTML.includes('Administrar grupo'));run("space='teacher';nav()");assert.ok(!el('navigation').innerHTML.includes('Unirme a un grupo'));assert.ok(el('navigation').innerHTML.includes('space-select'));
});
test('nombres no confiables se escapan en grupos e invitaciones',()=>{
  const {run,el}=setup();run("user={displayName:'Prueba'};profile={teacherEnabled:true,catalog};groups=[{id:'g',name:'<script>hola</script>',teacherName:'<img>',status:'active',memberCount:0}];selected='g';space='teacher';page='groups';render()");assert.ok(!el('main').innerHTML.includes('<script>'));assert.ok(el('main').innerHTML.includes('&lt;script&gt;'));
});
test('una respuesta recibida después de cambiar sesión se descarta',async()=>{
  const {run,ctx}=setup();let resolve;ctx.pending=new Promise(r=>resolve=r);run('api={call:()=>pending}');const request=run("request('getProfile')");run('epoch++');resolve({teacherEnabled:true});await assert.rejects(request,/sesión cambió/);
});
test('grupo archivado no muestra filas almacenadas',()=>{
  const {run,el}=setup();run("user={displayName:'Prueba'};profile={teacherEnabled:true,catalog};space='teacher';page='group';groups=[{id:'g',name:'Curso',status:'archived'}];selected='g';rows=[{alias:'Privado'}];render()");assert.ok(el('main').innerHTML.includes('seguimiento terminó'));assert.ok(!el('main').innerHTML.includes('Privado'));
});

import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import vm from 'node:vm';
import {readAccount,writeAccount,removeAccount,claimLegacy,legacyKeys} from '../assets/account-progress.mjs';
import {RECORD_IDS,cleanRecord,newerRecord,recordKey} from '../assets/report-records.mjs';
class Storage{map=new Map();get length(){return this.map.size}key(i){return [...this.map.keys()][i]??null}getItem(k){return this.map.get(k)??null}setItem(k,v){this.map.set(k,String(v))}removeItem(k){this.map.delete(k)}}
test('dos cuentas no comparten páginas, casillas o tiempo de sesión',()=>{const s=new Storage();for(const key of ['map:completed:unidad0','progress:unidad0','map:page-session:unidad0:bloque-a']){writeAccount(s,'A',key,['privado']);assert.deepEqual(readAccount(s,'B',key,[]),[]);assert.deepEqual(readAccount(s,null,key,[]),[]);assert.deepEqual(readAccount(s,'A',key,[]),['privado'])}});
test('claves antiguas no se asignan automáticamente',()=>{const s=new Storage();s.setItem('map:completed:unidad0','["introduccion"]');assert.deepEqual(readAccount(s,'A','map:completed:unidad0',[]),[]);assert.equal(legacyKeys(s).length,1)});
test('recuperación explícita conserva originales y une sin duplicar',()=>{const s=new Storage();s.setItem('map:completed:unidad0','["introduccion","introduccion"]');s.setItem('progress:unidad1','["unidad1-chk-01"]');assert.throws(()=>claimLegacy(s,'A',false));claimLegacy(s,'A',true);assert.deepEqual(readAccount(s,'A','map:completed:unidad0',[]),['introduccion']);assert.equal(readAccount(s,'A','map:legacy-pending:unidad1',false),true);assert.ok(s.getItem('map:completed:unidad0'));assert.throws(()=>claimLegacy(s,'B',true));assert.deepEqual(readAccount(s,'B','map:completed:unidad0',[]),[])});
test('recuperar páginas no importa el tiempo antiguo de otra sesión',()=>{const s=new Storage();s.setItem('map:page-session:unidad0:bloque-a','{"activeSeconds":900}');claimLegacy(s,'A',true);assert.deepEqual(readAccount(s,'A','map:page-session:unidad0:bloque-a',{}),{})});
test('una lectura antigua que termina tras cambiar de cuenta solo escribe en su UID original',async()=>{
  const storage=new Storage();let resolve;const wait=new Promise(r=>resolve=r);
  const map={auth:{currentUser:{uid:'A'}}};
  const context=vm.createContext({readAccount,writeAccount,removeAccount,localStorage:storage,window:{__MAP__:map},document:{},location:{pathname:'/matematica-a-pedal/unidad0/bloque-a.html'},getDoc:()=>wait,doc:(...args)=>args,setDoc:async()=>{},serverTimestamp:()=>1});
  let source=readFileSync(new URL('../assets/completion-tracker.js',import.meta.url),'utf8').replace(/^import[\s\S]*?;\r?\n/gm,'');source=source.slice(0,source.indexOf('(async function initCompletionTracker'));
  vm.runInContext(source,context);const task=vm.runInContext("readProgressDoc({},'A','unidad0')",context);map.auth.currentUser={uid:'B'};resolve({exists:()=>true,data:()=>({completedPages:['introduccion'],progressModelVersion:2})});await task;
  assert.deepEqual(readAccount(storage,'A','map:completed:unidad0',[]),['introduccion']);assert.deepEqual(readAccount(storage,'B','map:completed:unidad0',[]),[]);
});
test('una escritura diferida de A se cancela cuando inicia sesión B',async()=>{
  const storage=new Storage(),writes=[];let onChange,bind,initialize,delayed;
  const input={classList:{contains:()=>false},dataset:{progressId:'a'},checked:false,addEventListener:(name,fn)=>{if(name==='change')onChange=fn}};
  const map={auth:{currentUser:{uid:'A'}},db:{},onAuthStateChanged:(auth,fn)=>bind=fn};
  const context=vm.createContext({readAccount,writeAccount,localStorage:storage,window:{__MAP__:map},document:{querySelectorAll:()=>[input]},location:{pathname:'/matematica-a-pedal/unidad0/'},Date,setInterval:fn=>{initialize=fn;return 1},clearInterval(){},setTimeout:fn=>{delayed=fn;return 1},clearTimeout(){},getDoc:async()=>({data:()=>({checked:[]})}),setDoc:async(...args)=>writes.push(args),doc:(...args)=>args,onSnapshot:()=>()=>{},serverTimestamp:()=>1,console});
  const source=readFileSync(new URL('../assets/account-checkbox-sync.mjs',import.meta.url),'utf8').replace(/^import[^\n]*\n/gm,'');
  vm.runInContext(source,context);initialize();await bind({uid:'A'});input.checked=true;onChange();const stale=delayed;
  map.auth.currentUser={uid:'B'};await bind({uid:'B'});await stale();
  assert.equal(writes.length,0);assert.deepEqual(readAccount(storage,'A','progress:unidad0',[]),['a']);assert.deepEqual(readAccount(storage,'B','progress:unidad0',[]),[]);
});
test('migrar a Google conserva avance local anónimo y avance previo de la cuenta destino',async()=>{
  const storage=new Storage();writeAccount(storage,'anon','map:completed:unidad0',['introduccion']);
  const records=new Map([['users/google/progress/unidad0',{completedPages:['bloque-a'],checked:[],progressModelVersion:2}]]);
  const context=vm.createContext({readAccount,RECORD_IDS,cleanRecord,newerRecord,recordKey,localStorage:storage,sessionStorage:new Storage(),console,Date,doc:(db,...parts)=>parts.join('/'),collection:(db,...parts)=>parts.join('/'),getDocs:async()=>({docs:[]}),getDoc:async path=>({exists:()=>records.has(path),data:()=>records.get(path)}),setDoc:async(path,data)=>records.set(path,data),serverTimestamp:()=>1,db:{}});
  let source=readFileSync(new URL('../assets/firebase-init.js',import.meta.url),'utf8');source=source.slice(source.indexOf('function normalizeMeta'),source.indexOf('const authReady'));
  vm.runInContext(source,context);const snapshot=await vm.runInContext("readProgressSnapshot('anon')",context);context.snapshot=snapshot;
  await vm.runInContext("mergeProgressIntoUser(snapshot,'google')",context);
  assert.deepEqual([...records.get('users/google/progress/unidad0').completedPages].sort(),['bloque-a','introduccion']);
  assert.deepEqual(readAccount(storage,'anon','map:completed:unidad0',[]),['introduccion']);
  assert.deepEqual(readAccount(storage,'otra-persona','map:completed:unidad0',[]),[]);
});

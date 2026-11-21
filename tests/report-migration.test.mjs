import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
import {RECORD_IDS,cleanRecord,newerRecord,recordKey} from '../assets/report-records.mjs';import {readAccount,writeAccount} from '../assets/account-progress.mjs';import {diagnosticVersion} from '../assets/autodiagnostico-catalog.mjs';
test('la vinculación anónimo a Google conserva los reportes sin unir respuestas de intentos distintos',async()=>{
 const storage={map:new Map(),getItem(k){return this.map.get(k)||null},setItem(k,v){this.map.set(k,v)}};
 const newer={schemaVersion:1,contentVersion:diagnosticVersion,savedAt:200,answers:Array(20).fill('b')};
 const older={...newer,savedAt:100,answers:Array(20).fill('a')};writeAccount(storage,'anon',recordKey('diagnostic'),{record:newer,pending:true});
 const records=new Map([['users/google/progress/'+RECORD_IDS.diagnostic,older]]);
 const context=vm.createContext({readAccount,RECORD_IDS,cleanRecord,newerRecord,recordKey,localStorage:storage,sessionStorage:storage,console,Date,doc:(db,...parts)=>parts.join('/'),collection:(db,...parts)=>parts.join('/'),getDocs:async()=>({docs:[]}),getDoc:async path=>({exists:()=>records.has(path),data:()=>records.get(path)}),setDoc:async(path,data)=>records.set(path,data),serverTimestamp:()=>1,db:{}});
 let source=readFileSync(new URL('../assets/firebase-init.js',import.meta.url),'utf8');source=source.slice(source.indexOf('function normalizeMeta'),source.indexOf('const authReady'));vm.runInContext(source,context);
 context.snapshot=await vm.runInContext("readProgressSnapshot('anon')",context);await vm.runInContext("mergeProgressIntoUser(snapshot,'google')",context);
 const result=records.get('users/google/progress/'+RECORD_IDS.diagnostic);assert.ok(result.answers.every(a=>a==='b'));assert.equal(result.completedPages,undefined);
 assert.equal(readAccount(storage,'otra',recordKey('diagnostic'),null),null);
});

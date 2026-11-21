import test from 'node:test';import assert from 'node:assert/strict';
import {createAccountRecords,RECORD_IDS,cleanRecord,recordKey,newerRecord} from '../assets/report-records.mjs';
import {diagnosticVersion} from '../assets/autodiagnostico-catalog.mjs';
import {writeAccount,readAccount} from '../assets/account-progress.mjs';
class Storage{data=new Map();getItem(k){return this.data.get(k)||null}setItem(k,v){this.data.set(k,v)}}
const record=(time=100,answer='a')=>({schemaVersion:1,contentVersion:diagnosticVersion,savedAt:time,answers:Array(20).fill(answer)});
test('respuesta tardía de A no pinta ni guarda datos bajo la cuenta B',async()=>{
 const auth={currentUser:{uid:'A'}},storage=new Storage();let finish;
 const s=createAccountRecords({auth,storage,read:()=>new Promise(r=>finish=r),write:async()=>{}});
 const pending=s.load('diagnostic','A');auth.currentUser={uid:'B'};finish(record());await assert.rejects(pending,/cuenta cambió/);assert.equal(readAccount(storage,'B',recordKey('diagnostic'),null),null);
});
test('cancela escritura en cola si cambia la identidad; las cuentas no comparten resultados',async()=>{
 const auth={currentUser:{uid:'A'}},storage=new Storage(),writes=[];
 const s=createAccountRecords({auth,storage,read:async()=>null,write:async(...a)=>writes.push(a)});
 const pending=s.save('diagnostic',record(),'A');auth.currentUser={uid:'B'};await assert.rejects(pending,/cuenta cambió/);assert.equal(writes.length,0);assert.equal((await s.load('diagnostic','B')).record,null);
});
test('una ráfaga de cambios conserva el último registro completo, sin mezclar respuestas',async()=>{
 const auth={currentUser:{uid:'A'}},storage=new Storage(),remote=new Map();let clock=100;
 const s=createAccountRecords({auth,storage,clock:()=>++clock,read:async(uid,id)=>remote.get(uid+id),write:async(uid,id,r)=>{remote.set(uid+id,r)}});
 await Promise.all([s.save('diagnostic',record(1,'a'),'A'),s.save('diagnostic',record(2,'b'),'A')]);
 const r=await s.forReport('diagnostic','A');assert.ok(r.answers.every(a=>a==='b'));
});
test('el PDF no reemplaza errores de conexión por resultados vacíos',async()=>{
 const auth={currentUser:{uid:'A'}},storage=new Storage();writeAccount(storage,'A',recordKey('diagnostic'),{record:record(),pending:false});
 const s=createAccountRecords({auth,storage,read:async()=>{throw Error('offline')},write:async()=>{}});
 assert.equal((await s.load('diagnostic','A')).offline,true);await assert.rejects(s.forReport('diagnostic','A'),/conexión/);
});
test('recupera borrador propio pendiente antes de leer el reporte desde servidor',async()=>{
 const auth={currentUser:{uid:'A'}},storage=new Storage();let remote=record(50);
 writeAccount(storage,'A',recordKey('diagnostic'),{record:record(100,'c'),pending:true});
 const s=createAccountRecords({auth,storage,read:async()=>remote,write:async(u,id,r)=>remote=r});
 assert.equal((await s.forReport('diagnostic','A')).answers[0],'c');
});
test('valida las respuestas y conserva el registro más reciente al migrar',()=>{
 assert.equal(cleanRecord('diagnostic',record(100,'inventada')),null);assert.equal(newerRecord(record(200),record(100)).savedAt,200);assert.equal(RECORD_IDS.diagnostic,'report-autodiagnostico-v1');
});
test('si el navegador bloquea almacenamiento local, igual confirma el guardado remoto',async()=>{
 let remote=null;const auth={currentUser:{uid:'A'}},storage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
 const s=createAccountRecords({auth,storage,read:async()=>remote,write:async(u,id,r)=>remote=r});await s.save('diagnostic',record(),'A');assert.ok(remote);assert.ok((await s.forReport('diagnostic','A')).answers.every(a=>a==='a'));
});

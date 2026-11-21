import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
import {buildReport,units,selectedUnits} from '../assets/report-model.mjs';
class Element{value='';disabled=false;children=[];listeners={};textContent='';append(x){this.children.push(x)}addEventListener(name,fn){this.listeners[name]=fn}}
async function fixture(read=async()=>({exists:()=>false})){
 const ids=['report-scope','report-download','report-status','report-name','report-understood','report-help'],elements=Object.fromEntries(ids.map(k=>[k,new Element()]));
 const auth={currentUser:{uid:'A',displayName:'Persona A',isAnonymous:false}};let bind;const downloads=[];
 const map={auth,onAuthStateChanged:(auth,fn)=>{bind=fn;fn(auth.currentUser)}};
 const reader={result:'data:font/ttf;base64,Zg==',readAsDataURL(){this.onload()}};
 const context=vm.createContext({document:{getElementById:id=>elements[id],createElement:()=>new Element()},window:{jspdf:{jsPDF:{}},addEventListener(){}},URL,Intl,Date,console,
  waitForMAP:async()=>map,createReportStore:()=>({forReport:async()=>null}),doc:(db,...p)=>p.join('/'),getDocFromServer:read,
  fetch:async()=>({ok:true,blob:async()=>({})}),FileReader:function(){return {...reader}},buildReport,units,selectedUnits,
  renderReportPDF:(type,report)=>({save:name=>downloads.push({name,report})})});
 let source=readFileSync(new URL('../assets/report-ui.mjs',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace("await import('./vendor/jspdf-4.2.1.umd.min.js');",'').replaceAll('import.meta.url',"'http://localhost/assets/report-ui.mjs'");
 vm.runInContext(source,context);await new Promise(r=>setImmediate(r));
 return {elements,auth,downloads,bind,click:()=>elements['report-download'].listeners.click()};
}
test('el formulario limita el alcance real y deja la reflexión fuera cuando está vacía',async()=>{
 const f=await fixture();f.elements['report-scope'].value='unidad1';await f.click();assert.equal(f.downloads.length,1);assert.equal(f.downloads[0].report.total,9);assert.equal(f.downloads[0].report.reflection.help,'');
});
test('cambio de cuenta limpia nombre, reflexión y alcance antes de otro reporte',async()=>{
 const f=await fixture();f.elements['report-help'].value='Privado de A';f.elements['report-scope'].value='unidad2';f.auth.currentUser={uid:'B',displayName:'Persona B'};f.bind(f.auth.currentUser);assert.equal(f.elements['report-help'].value,'');assert.equal(f.elements['report-scope'].value,'todo');assert.equal(f.elements['report-name'].value,'Persona B');
});
test('una descarga pendiente se cancela si cambia de cuenta mientras carga datos',async()=>{
 let release;const wait=new Promise(r=>release=r),f=await fixture(()=>wait);f.elements['report-scope'].value='unidad1';const task=f.click();f.auth.currentUser={uid:'B',displayName:'Persona B'};f.bind(f.auth.currentUser);release({exists:()=>false});await task;assert.equal(f.downloads.length,0);
});
test('fallo de lectura no descarga un reporte vacío y visitante no puede descargar',async()=>{
 const f=await fixture(async()=>{throw Error('Sin conexión')});f.elements['report-scope'].value='unidad1';await f.click();assert.equal(f.downloads.length,0);assert.match(f.elements['report-status'].textContent,/conexión/);f.auth.currentUser={uid:'visitor',isAnonymous:true};f.bind(f.auth.currentUser);assert.equal(f.elements['report-download'].disabled,true);await f.click();assert.equal(f.downloads.length,0);
});
test('si cambia la identidad antes de llegar su aviso, no atribuye la reflexión anterior a la nueva cuenta',async()=>{
 const f=await fixture();f.elements['report-help'].value='Solo de A';f.auth.currentUser={uid:'B',displayName:'B'};await f.click();assert.equal(f.downloads.length,0);assert.equal(f.elements['report-help'].value,'');
});

import assert from 'node:assert/strict';import {jsPDF,pdfAssets} from './pdf-assets.mjs';
import {buildReport,units} from '../assets/report-model.mjs';import {renderReportPDF} from '../assets/report-pdf.mjs';import {questions,diagnosticVersion} from '../assets/autodiagnostico-catalog.mjs';
const diagnostic={schemaVersion:1,contentVersion:diagnosticVersion,savedAt:100,answers:questions.map((q,i)=>i%3===0?'unknown':q.answer)};
const progress=Object.fromEntries(units.map(u=>[u.id,{progressModelVersion:2,completedPages:u.pages.slice(0,3).map(p=>p.id)}]));
for(const scope of ['todo',...units.map(u=>u.id)]){
 const report=buildReport({scope,progress,diagnostic,name:'José Pérez',reflection:{understood:'Comprendí los conjuntos numéricos.',help:'Quisiera consultar las fracciones.'}});
 const pdf=renderReportPDF(jsPDF,report,pdfAssets),bytes=Buffer.from(pdf.output('arraybuffer'));
 assert.ok(bytes.subarray(0,5).equals(Buffer.from('%PDF-')));assert.ok(bytes.length>15000);assert.ok(pdf.getNumberOfPages()>=2);
 if(scope==='todo')assert.ok(pdf.getNumberOfPages()<=4);else if(scope!=='unidad0')assert.equal(pdf.getNumberOfPages(),2);
}
const long=renderReportPDF(jsPDF,buildReport({name:'Nombre largo '.repeat(9),reflection:{understood:'Texto de prueba con π. '.repeat(30),help:'Texto de prueba. '.repeat(40)}}),pdfAssets);
assert.ok(long.getNumberOfPages()<=7);
console.log('PDF real generado correctamente para los seis alcances, textos largos y caracteres acentuados.');

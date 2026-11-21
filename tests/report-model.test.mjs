import test from 'node:test';import assert from 'node:assert/strict';
import {buildReport,diagnosticSummary,units} from '../assets/report-model.mjs';
import {questions,diagnosticVersion} from '../assets/autodiagnostico-catalog.mjs';
import {readFileSync} from 'node:fs';
const record=answers=>({schemaVersion:1,contentVersion:diagnosticVersion,savedAt:100,answers});
test('catálogo y preguntas conservan el contenido publicado',()=>{
 const nav=JSON.parse(readFileSync(new URL('../assets/nav.json',import.meta.url)));
 assert.equal(units.reduce((n,u)=>n+u.pages.length,0),38);assert.equal(questions.length,20);
 assert.deepEqual(units.map(u=>u.pages.map(p=>p.href)),nav.unidades.map(u=>u.bloques.map(p=>p.href)));
});
test('una unidad filtra páginas, porcentajes y preguntas sin mezclar el total global',()=>{
 const answers=questions.map(q=>q.answer);answers[0]='unknown';answers[6]='unknown';
 const report=buildReport({scope:'unidad1',progress:{unidad1:{progressModelVersion:2,completedPages:['bloque-a','bloque-a','pagina-inventada']},unidad0:{completedPages:['introduccion']}},diagnostic:record(answers)});
 assert.equal(report.total,9);assert.equal(report.done,1);assert.equal(report.percent,11);assert.equal(report.diagnostic.total,4);assert.equal(report.diagnostic.totals.correct,3);assert.equal(report.diagnostic.suggestions.length,1);assert.equal(report.diagnostic.suggestions[0].key,'fractions');assert.equal(report.self,null);
});
test('no convierte falta de datos, versiones desconocidas o preguntas pendientes en errores',()=>{
 const empty=buildReport({});assert.equal(empty.missing,38);assert.equal(empty.diagnostic.available,false);
 assert.equal(diagnosticSummary({...record(questions.map(q=>q.answer)),contentVersion:'otra'}).available,false);
 const pending=diagnosticSummary(record(Array(20).fill(null)));assert.equal(pending.totals.pending,20);assert.deepEqual(pending.suggestions,[]);
});
test('propone hasta tres temas desde respuestas y permite reflexión realmente vacía',()=>{
 const d=record(questions.map(()=> 'unknown'));const report=buildReport({diagnostic:d,reflection:{understood:'  ',help:''}});
 assert.equal(report.diagnostic.suggestions.length,3);assert.equal(report.reflection.understood,'');assert.equal(report.reflection.help,'');assert.throws(()=>buildReport({scope:'ajena'}));
});
test('confianza sin puntaje declarado no se convierte en un cero sobre diez',()=>{
 const r=buildReport({self:{schemaVersion:1,savedAt:100,correctItems:[],confidence:{frac:'mid'}}});assert.equal(r.self.available,true);assert.equal(r.self.scoreDeclared,false);assert.equal(r.self.confidence[2].state,'En proceso');
});

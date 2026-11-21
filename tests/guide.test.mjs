import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {createGuidePDF} from '../scripts/generate-guide.mjs';import {units} from '../assets/report-catalog.mjs';import {guideSections,themeMap} from '../docs/guia-contenidos-data.mjs';
test('la guía desarrolla conceptos de los cuatro temas y enlaza todas las páginas del recorrido',()=>{
 const {pdf,pageCount,anchors}=createGuidePDF(),source=pdf.output();
 assert.ok(pageCount>=12&&pageCount<=14);assert.equal(themeMap.length,4);assert.ok(guideSections.reduce((n,s)=>n+s.concepts.length,0)>=45);
 for(const unit of units)for(const page of unit.pages)assert.ok(source.includes('https://utec-math.github.io'+page.href),'Falta enlace PDF a '+page.href);
 for(const theme of themeMap)assert.ok(anchors.get(theme.section)>anchors.get('mapa'));
 assert.equal((source.match(/\/Dest \[/g)||[]).length,4);
 for(const section of guideSections)for(const path of section.sources)assert.ok(existsSync(new URL('../'+path,import.meta.url)));
});
test('la descarga tiene acceso propio desde el encabezado, portada y presentación del proyecto',()=>{
 for(const path of ['assets/header.html','index.html','sobre.html'])assert.match(readFileSync(new URL('../'+path,import.meta.url),'utf8'),/href="(?:\/matematica-a-pedal\/)?docentes\.html"/);
 const landing=readFileSync(new URL('../docentes.html',import.meta.url),'utf8');assert.match(landing,/href="descargas\/guia-contenidos-docentes.pdf[^\"]*" download/);assert.match(landing,/No necesitás registrarte/);
 assert.ok(!readFileSync(new URL('../progreso.html',import.meta.url),'utf8').includes('guia-contenidos-docentes.pdf'));
});

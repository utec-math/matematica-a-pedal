import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';import {units} from '../assets/report-catalog.mjs';
test('la descarga coincide con la guía docente aprobada y enlaza todas las páginas del recorrido',()=>{
 const metadata=JSON.parse(readFileSync(new URL('../docs/guia-docente-publicada.json',import.meta.url),'utf8'));
 const bytes=readFileSync(new URL('../'+metadata.file,import.meta.url)),source=bytes.toString('latin1');
 assert.ok(bytes.subarray(0,5).equals(Buffer.from('%PDF-')));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),metadata.sha256);
 assert.equal((source.match(/\/Type\s*\/Page\b/g)||[]).length,metadata.pageCount);assert.equal(metadata.pageCount,18);
 assert.equal((source.match(/\/URI\s*\(/g)||[]).length,metadata.externalLinks);assert.match(source,/\/Outlines/);
 for(const unit of units)for(const page of unit.pages){assert.ok(source.includes('https://utec-math.github.io'+page.href),'Falta enlace PDF a '+page.href);assert.ok(existsSync(new URL('../'+page.href.replace('/matematica-a-pedal/',''),import.meta.url)));}
 assert.equal(units.reduce((n,u)=>n+u.pages.length,0),metadata.catalogPages);
});
test('la descarga tiene acceso propio desde el encabezado, portada y presentación del proyecto',()=>{
 for(const path of ['assets/header.html','index.html','sobre.html'])assert.match(readFileSync(new URL('../'+path,import.meta.url),'utf8'),/href="(?:\/matematica-a-pedal\/)?docentes\.html"/);
 const landing=readFileSync(new URL('../docentes.html',import.meta.url),'utf8');assert.match(landing,/href="descargas\/guia-contenidos-docentes.pdf[^\"]*" download/);assert.match(landing,/No necesitás registrarte/);
 assert.ok(!readFileSync(new URL('../progreso.html',import.meta.url),'utf8').includes('guia-contenidos-docentes.pdf'));
});

// Generador histórico de la guía de conceptos, sustituida por la edición docente aprobada.
// La descarga vigente es un PDF estático; ver docs/guia-docente-publicada.json.
import {fileURLToPath} from 'node:url';import {resolve} from 'node:path';
import {jsPDF,pdfAssets} from './pdf-assets.mjs';
import {units} from '../assets/report-catalog.mjs';
import {themeMap,guideSections} from '../docs/guia-contenidos-data.mjs';

export function createGuidePDF(){
 const pdf=new jsPDF({unit:'pt',format:'a4',compress:true,putOnlyUsedFonts:true});
 const W=595.28,H=841.89,M=42,B=W-2*M,limit=H-65;
 pdf.addFileToVFS('regular.ttf',pdfAssets.fontBase64);pdf.addFont('regular.ttf','Roboto','normal');pdf.addFileToVFS('bold.ttf',pdfAssets.fontBoldBase64);pdf.addFont('bold.ttf','Roboto','bold');
 const anchors=new Map(),indexLinks=[],sourceLinks=[];let y=0,currentTitle='';
 function text(value,x,top,size=10,bold=false,color='#493726',options={}){pdf.setFont('Roboto',bold?'bold':'normal');pdf.setFontSize(size);pdf.setTextColor(color);pdf.text(value,x,top,options)}
 function lines(value,width=B,size=10){pdf.setFont('Roboto','normal');pdf.setFontSize(size);return pdf.splitTextToSize(value,width)}
 function header(label){
  for(let i=0;i<80;i++){pdf.setFillColor(255,213-Math.round(48*i/79),128-Math.round(39*i/79));pdf.rect(i*W/80,0,W/80+.3,82,'F')}
  text('MATEMÁTICA A PEDAL',M,34,17,true,'#783f04');text('Guía de contenidos para docentes',M,58,10,false,'#783f04');
  pdf.addImage(pdfAssets.logo,'PNG',W-M-100,8,100,65,'logo');y=111;
  if(label){text(label,M,y,9,true,'#735b43');y+=24}
 }
 function page(title,id){if(pdf.getNumberOfPages()>1||y)pdf.addPage();currentTitle=title;header(title);if(id)anchors.set(id,pdf.getNumberOfPages())}
 function ensure(height){if(y+height>limit){pdf.addPage();header(currentTitle+' / continuación')}}
 function heading(value,size=17){const list=lines(value,B,size);ensure(list.length*(size+4)+11);text(list,M,y,size,true,'#783f04');y+=list.length*(size+4)+10}
 function para(value,size=10,gap=9){const list=lines(value,B,size),height=list.length*size*1.4;ensure(height+gap);text(list,M,y,size);y+=height+gap}
 function labelPara(label,value){
  const size=10,list=lines(label+'. '+value,B,size),height=list.length*14+8;ensure(height);
  text(label+'.',M,y,size,true,'#783f04');pdf.setFont('Roboto','normal');pdf.setFontSize(size);
  const offset=pdf.getTextWidth(label+'. ');text(list[0].slice(label.length+2),M+offset,y,size);
  if(list.length>1)text(list.slice(1),M,y+14,size,false,'#493726',{lineHeightFactor:1.4});y+=height;
 }
 function link(label,href,width=B){const list=lines(label,width,9.2);ensure(list.length*13+7);text(list,M,y,9.2,false,'#783f04');pdf.link(M,y-10,width,list.length*13,{url:'https://utec-math.github.io/matematica-a-pedal/'+href});sourceLinks.push(href);y+=list.length*13+7}
 function sourceList(hrefs){
  const labels=hrefs.map(href=>{const p=units.flatMap(u=>u.pages).find(p=>p.href.endsWith('/'+href));if(!p)throw Error('Fuente fuera del catálogo: '+href);return p.title.replace(/^Paso \d+ · /,'').replace(/ · /g,' / ')});
  let needed=26;for(let i=0;i<labels.length;i+=2)needed+=Math.max(...labels.slice(i,i+2).map(label=>lines(label,B/2-16,8.7).length*12+6));
  ensure(needed);heading('Dónde está en la plataforma',12);
  for(let i=0;i<hrefs.length;i+=2){let rowHeight=0;for(let j=0;j<2&&i+j<hrefs.length;j++){
   const href=hrefs[i+j],p=units.flatMap(u=>u.pages).find(p=>p.href.endsWith('/'+href));if(!p)throw Error('Fuente fuera del catálogo: '+href);
   const label=labels[i+j],x=M+j*(B/2+6),list=lines(label,B/2-16,8.7);rowHeight=Math.max(rowHeight,list.length*12+6);
   text(list,x,y,8.7,false,'#783f04',{lineHeightFactor:1.38});pdf.link(x,y-9,B/2-16,list.length*12,{url:'https://utec-math.github.io/matematica-a-pedal/'+href});sourceLinks.push(href);
  }y+=rowHeight;}
 }
 page('PRESENTACIÓN','presentacion');heading('Qué es Matemática a Pedal',23);
 para('Matemática a Pedal es una propuesta educativa abierta para acompañar el aprendizaje autónomo de matemática, especialmente en la transición y el recorrido inicial de carreras científico-tecnológicas. Reúne teoría, ejemplos desarrollados, práctica y recursos digitales en una ruta que cada estudiante puede recorrer a su ritmo.',11);
 heading('Una propuesta para aprender y volver a intentar',15);
 para('El recorrido alterna chequeos breves, explicaciones paso a paso, ejercicios de dificultad creciente, pistas, soluciones y cierres de autocorrección. Los problemas aplicados vinculan las ideas con situaciones de ciencias e ingeniería.');
 heading('Qué aporta a quien enseña',15);
 para('Esta guía permite conocer la propuesta, identificar qué conceptos se desarrollan y elegir páginas o etapas para recomendar. Puede complementar un curso que ya utiliza Moodle u otra plataforma: no exige crear un grupo docente ni trasladar allí la gestión del curso.');
 heading('Cómo está organizada esta guía',15);
 para('Primero presenta el mapa general. Después distingue el punto de entrada transversal y abre cada tema en conceptos, definiciones, ejemplos orientativos y actividades. Cada ficha termina con enlaces al contenido desarrollado en la web.');
 para('Es una síntesis para seleccionar materiales; las explicaciones completas, demostraciones, ejercicios y soluciones permanecen en las páginas enlazadas. No establece una carga horaria ni equivale a un programa de asignatura.',9.5);
 text('Autor del proyecto: Martín Bulanti / UTEC, Uruguay',M,y,10,true,'#783f04');y+=22;
 link('Abrir la plataforma','index.html');

 page('MAPA GENERAL','mapa');heading('Cuatro grandes temas',22);
 para('El catálogo combina cuatro etapas temáticas con un calentamiento inicial transversal. Las cinco unidades del recorrido reúnen 38 páginas, incluidas presentaciones y cierres.');
 for(const theme of themeMap){ensure(112);heading(theme.title,15);para(theme.description,10,8);
  const rect={x:M,y:y-9,w:B,h:14,target:theme.section,page:pdf.getNumberOfPages()};text('Ver conceptos en esta guía',M,y,9.5,false,'#783f04');indexLinks.push(rect);y+=22;
  link('Abrir la etapa en la web',theme.href);
 }
 ensure(85);heading('El punto de entrada',14);para('El autodiagnóstico orienta el repaso; el calentamiento reúne chequeos rápidos de bases numéricas. No se presenta como un quinto gran tema independiente.');

 page('PUNTO DE ENTRADA','entrada');heading('Autodiagnóstico y calentamiento',20);
 labelPara('Autodiagnóstico','Cuestionario de 20 preguntas que distingue respuestas correctas, para revisar, «No sé» y sin responder. Sugiere temas de repaso a partir de las respuestas y permite retomar el registro de la cuenta.');
 labelPara('Calentamiento matemático','Chequeos breves de conjuntos numéricos, propiedades, fracciones, potencias, raíces y notación científica. Cuando una idea necesita desarrollo, se enlaza con la explicación completa de la etapa correspondiente.');
 labelPara('Chequeo final y autoevaluación','El cierre del calentamiento incluye autocorrección y valoración de confianza por tema. Esa declaración personal se distingue del resultado del autodiagnóstico y del avance por páginas.');
 heading('Cómo puede utilizarlo un docente',14);
 para('Una posibilidad es proponer el autodiagnóstico, conversar sobre las dudas y elegir luego un conjunto acotado de páginas. Otra es recomendar un chequeo específico del calentamiento antes de entrar a una etapa. Son orientaciones de uso, no secuencias obligatorias.');
 link('Abrir el autodiagnóstico','autodiagnostico.html');link('Abrir el calentamiento','unidad0/index.html');
 sourceList(units[0].pages.slice(1).map(p=>p.href.replace('/matematica-a-pedal/','')));

 for(const section of guideSections){
  page(section.theme,section.id);heading(section.title,20);para(section.intro);
  for(const [label,value]of section.concepts)labelPara(label,value);
  if(section.example){ensure(50);heading('Un ejemplo de lo que se trabaja',12);para(section.example,9.5)}
  if(section.practice){ensure(50);heading('Práctica y recursos',12);para(section.practice,9.5)}
  sourceList(section.sources);
 }
 page('ACOMPAÑAMIENTO DOCENTE','acompanar');heading('Elegir, proponer y conversar',22);
 labelPara('Elegir un objetivo','Usá el mapa y las fichas para seleccionar un tema o un concepto concreto. La cantidad de páginas no obliga a proponer toda una unidad.');
 labelPara('Dar una consigna','Compartí los enlaces de las páginas y explicitá qué esperás: resolver ejercicios, justificar un procedimiento, explicar una definición o traer una duda.');
 labelPara('Pedir evidencia del proceso','El estudiante puede descargar su reporte de todo el recorrido o de una unidad y entregarlo por el medio que indique el curso. La reflexión opcional ayuda a iniciar una conversación.');
 heading('Cómo leer el reporte personal',15);
 labelPara('Recorrido','Informa las páginas con finalización registrada. Haber completado una página no demuestra por sí solo que se hayan acertado sus ejercicios.');
 labelPara('Autodiagnóstico','Presenta los resultados guardados del cuestionario y orienta el repaso. Las preguntas sin responder se distinguen de las respuestas incorrectas.');
 labelPara('Autoevaluación y reflexión','Recogen lo que declara la persona al autocorregirse y al expresar qué comprendió o qué necesita consultar. No son una calificación automática.');
 para('La ausencia de registros no se interpreta como falta de interés o desconocimiento. El reporte no certifica identidad, dominio ni integridad frente a modificaciones.',9.5);
 link('Abrir Mi progreso y el reporte personal','progreso.html');
 const pageCount=pdf.getNumberOfPages();
 for(const item of indexLinks){const pageNumber=anchors.get(item.target);pdf.setPage(item.page);pdf.link(item.x,item.y,item.w,item.h,{pageNumber});}
 for(let i=1;i<=pageCount;i++){pdf.setPage(i);pdf.setDrawColor('#E9D6B7');pdf.line(M,H-47,W-M,H-47);text('Guía docente / edición noviembre de 2026',M,H-29,8,false,'#735b43');text(`${i} / ${pageCount}`,W-M,H-29,8,false,'#735b43',{align:'right'})}
 const covered=new Set(sourceLinks);
 for(const unit of units)for(const p of unit.pages)if(!covered.has(p.href.replace('/matematica-a-pedal/','')))throw Error('Falta enlazar una página del recorrido: '+p.href);
 pdf.setProperties({title:'Matemática a Pedal - Guía de contenidos para docentes',author:'Matemática a Pedal',subject:'Presentación, mapa temático, conceptos, definiciones y orientaciones de uso'});
 return {pdf,pageCount,sourceLinks,anchors};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 throw new Error('Generador histórico retirado: no reemplaza la guía docente aprobada. Consultá docs/guia-docente-publicada.json y docs/reportes-pdf.md.');
}

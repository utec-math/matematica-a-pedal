import {writeFileSync,mkdirSync} from 'node:fs';import {jsPDF,pdfAssets} from './pdf-assets.mjs';import {units} from '../assets/report-catalog.mjs';
const pdf=new jsPDF({unit:'pt',format:'a4',compress:true,putOnlyUsedFonts:true}),W=595.28,H=841.89,M=42;
pdf.addFileToVFS('regular.ttf',pdfAssets.fontBase64);pdf.addFont('regular.ttf','Roboto','normal');pdf.addFileToVFS('bold.ttf',pdfAssets.fontBoldBase64);pdf.addFont('bold.ttf','Roboto','bold');
let y;
function text(value,x,top,size=10,bold=false){pdf.setFont('Roboto',bold?'bold':'normal');pdf.setFontSize(size);pdf.setTextColor('#493726');pdf.text(value,x,top)}
function para(value,size=10){pdf.setFont('Roboto','normal');pdf.setFontSize(size);const lines=pdf.splitTextToSize(value,W-2*M);text(lines,M,y,size);y+=lines.length*size*1.4+13}
function header(){pdf.setFillColor('#FFD580');pdf.rect(0,0,W,88,'F');text('MATEMÁTICA A PEDAL',M,35,17,true);text('Guía de contenidos para docentes',M,60,11);pdf.addImage(pdfAssets.logo,'PNG',W-M-100,12,100,65);y=125}
function heading(value){text(value,M,y,15,true);y+=25}
function link(label,href){pdf.setFont('Roboto','normal');pdf.setFontSize(10);pdf.setTextColor('#783f04');pdf.textWithLink(label,M,y,{url:'https://utec-math.github.io/matematica-a-pedal/'+href});y+=23}
header();heading('Elegir un recorrido para tu curso');
para('Material abierto para consultar contenidos, recomendar actividades y acompañar el trabajo del estudiante desde la plataforma que ya usa tu institución. Esta guía no requiere registro.');
heading('La propuesta');para('Una ruta con chequeos breves, explicaciones paso a paso, ejemplos, práctica, mini-apps y cierres de autocorrección. El catálogo de recorrido contiene 38 páginas en cinco unidades.');
for(const u of units){text(u.title.replace(/ · /g,' / '),M,y,11,true);y+=19;para(`${u.pages.length} páginas. Incluye inicio, bloques de trabajo y cierre.`,9)}
heading('Cómo seleccionarlo');para('Podés proponer el calentamiento para revisar conocimientos previos, elegir una etapa completa o indicar bloques específicos de acuerdo con los temas de tu curso. Las sugerencias son orientaciones de uso, no secuencias obligatorias.');
link('Abrir el autodiagnóstico de 20 preguntas','autodiagnostico.html');
const descriptions=[
 'Chequeos de conjuntos numéricos, propiedades, fracciones, potencias, raíces y notación científica. Ayudan a decidir qué explicación completa conviene consultar.',
 'Conjuntos y propiedades de las operaciones, signos, multiplicación y división, fracciones equivalentes, operaciones con fracciones y relación con decimales.',
 'Expresiones y polinomios, operaciones, productos notables, factorización y fracciones algebraicas. Ejemplos y práctica para transformar expresiones.',
 'Origen y aplicaciones de la trigonometría, medida y relaciones entre ángulos, razones trigonométricas y círculo unitario.',
 'Potencias, exponentes fraccionarios, radicales, notación científica, laboratorio interactivo y práctica final.'
];
for(const group of [[0,1],[2,3],[4]]){
 pdf.addPage();header();for(const i of group){const u=units[i];heading(u.title.replace(/ · /g,' / '));para(descriptions[i]);
 for(const p of u.pages){pdf.setFont('Roboto','normal');pdf.setFontSize(9.5);const lines=pdf.splitTextToSize(p.title.replace(/ · /g,' / '),W-2*M);pdf.setTextColor('#783f04');pdf.text(lines,M,y);pdf.link(M,y-10,W-2*M,lines.length*13,{url:'https://utec-math.github.io'+p.href});y+=lines.length*13+6}
 y+=22;}
 if(group[0]===4){heading('Qué puede aportar el reporte personal');para('El estudiante podrá descargar su avance, el resultado guardado del autodiagnóstico, sugerencias de repaso y una reflexión opcional. Podrá entregar ese PDF por Moodle, correo u otro medio que indique su docente. No hace falta que el docente gestione grupos en Matemática a Pedal.');
 heading('Cómo interpretar lo que se informa');para('Páginas completadas, respuestas al autodiagnóstico y autoevaluación declarada son indicadores distintos. El reporte no es una nota ni una certificación de dominio. La ausencia de registros no equivale a una respuesta incorrecta.');
 link('Consultar Mi progreso','progreso.html');}
 if(y>H-65)throw Error('La guía necesita revisar su paginación: '+y);
}
for(let i=1;i<=pdf.getNumberOfPages();i++){pdf.setPage(i);text('Catálogo revisado: noviembre de 2026',M,H-29,8);text(`${i} / ${pdf.getNumberOfPages()}`,W-M-35,H-29,8)}
pdf.setProperties({title:'Guía de contenidos para docentes - Matemática a Pedal',author:'Matemática a Pedal'});
mkdirSync(new URL('../descargas/',import.meta.url),{recursive:true});writeFileSync(new URL('../descargas/guia-contenidos-docentes.pdf',import.meta.url),Buffer.from(pdf.output('arraybuffer')));console.log('Guía generada: 4 páginas, enlaces a las 38 páginas del catálogo.');

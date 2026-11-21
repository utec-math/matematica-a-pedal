// The renderer only receives the selected person's own snapshot. No HTML parsing.
const C={ink:'#493726',brown:'#783F04',green:'#235B37',orange:'#FFA559',gold:'#FFD580',soft:'#FFF6E6',muted:'#735B43',line:'#E9D6B7'};
const safeText=value=>String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/−/g,'-');
export function renderReportPDF(jsPDF,report,{logo=null,fontBase64=null,fontBoldBase64=null}={}){
  const pdf=new jsPDF({unit:'pt',format:'a4',compress:true,putOnlyUsedFonts:true});
  if(fontBase64){pdf.addFileToVFS('RobotoMono.ttf',fontBase64);pdf.addFont('RobotoMono.ttf','RobotoMono','normal');pdf.addFileToVFS('RobotoMono-Bold.ttf',fontBoldBase64||fontBase64);pdf.addFont('RobotoMono-Bold.ttf','RobotoMono','bold')}
  const font=fontBase64?'RobotoMono':'helvetica',W=595.28,H=841.89,M=42,bodyW=W-2*M;
  let y=0;
  const color=(value)=>pdf.setTextColor(value);
  function text(value,x,top,size=10,bold=false,shade=C.ink,options={}){pdf.setFont(font,bold?'bold':'normal');pdf.setFontSize(size);color(shade);pdf.text(Array.isArray(value)?value.map(safeText):safeText(value),x,top,options)}
  function paragraph(value,x,top,width=bodyW,size=10,shade=C.ink){pdf.setFont(font,'normal');pdf.setFontSize(size);color(shade);const lines=pdf.splitTextToSize(safeText(value),width);pdf.text(lines,x,top,{lineHeightFactor:1.4});return lines.length*size*1.4}
  function rule(top){pdf.setDrawColor(C.line);pdf.setLineWidth(.6);pdf.line(M,top,W-M,top)}
  function header(label){
    for(let i=0;i<100;i++){pdf.setFillColor(255,213-Math.round(48*i/99),128-Math.round(39*i/99));pdf.rect(i*W/100,0,W/100+.2,88,'F')}
    text('MATEMÁTICA A PEDAL',M,36,17,true,C.brown);text(label,M,60,10,false,C.brown);
    if(logo)pdf.addImage(logo,'PNG',W-M-104,12,104,67,'map-logo','FAST');
    pdf.setFont(font,'bold');pdf.setFontSize(10);const nameLines=pdf.splitTextToSize(safeText(report.name),300);
    text(nameLines,M,113,10,true,C.brown);
    text('Emitido: '+new Intl.DateTimeFormat('es-UY',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'America/Montevideo'}).format(report.issuedAt),W-M,113,8,false,C.muted,{align:'right'});
    y=Math.max(145,123+nameLines.length*12);
  }
  function page(label){pdf.addPage();header(label)}
  function ensure(height,label='Mi recorrido / continuación'){if(y+height>H-75)page(label)}
  function heading(label){ensure(50);text(label,M,y,15,true,C.brown);y+=23}
  function note(value){pdf.setFont(font,'normal');pdf.setFontSize(9);const height=pdf.splitTextToSize(safeText(value),bodyW).length*12.6+10;ensure(height);y+=paragraph(value,M,y,bodyW,9,C.muted)+10}
  header('Mi recorrido / resumen para compartir');
  text('Mi recorrido',M,y,27,true,C.brown);y+=24;
  y+=paragraph('Alcance: '+report.scopeTitle,M,y,bodyW,10,C.brown)+14;
  text(`${report.done} de ${report.total} páginas completadas`,M,y,20,true,C.brown);y+=23;
  const bY=y;pdf.setFillColor(C.soft);pdf.roundedRect(M,bY,bodyW,9,4,4,'F');if(report.done){pdf.setFillColor(C.orange);pdf.roundedRect(M,bY,Math.max(9,bodyW*report.percent/100),9,4,4,'F')}y+=29;
  text(`${report.percent}% del alcance elegido`,M,y,11,true,C.brown);y+=19;
  text(`${report.pending} por completar / ${report.missing} sin registros utilizables`,M,y,10,false,C.muted);y+=27;
  const d=report.diagnostic;
  if(d.available){text(`Autodiagnóstico: ${d.totals.correct} de ${d.total} correctas`,M,y,13,true,C.brown);y+=18;text(`${d.totals.incorrect} para revisar / ${d.totals.unknown} No sé / ${d.totals.pending} sin responder`,M,y,10,false,C.muted);y+=26}
  else note('Autodiagnóstico: sin resultados guardados disponibles para este reporte.');
  heading('Avance por unidad');
  for(const unit of report.units){ensure(29);text(unit.title.replace(/ · /g,' / '),M,y,10,true);text(unit.available?`${unit.done} / ${unit.total}`:'Sin registros',W-M,y,9,false,C.brown,{align:'right'});y+=12;
    pdf.setFillColor(C.soft);pdf.roundedRect(M,y,bodyW,4,2,2,'F');if(unit.done){pdf.setFillColor(C.orange);pdf.roundedRect(M,y,Math.max(4,bodyW*unit.done/unit.total),4,2,2,'F')}y+=12;
  }
  y+=8;heading('Qué conviene repasar');
  if(!d.suggestions.length)note(d.available?'No hay sugerencias basadas en respuestas incorrectas o «No sé». Las preguntas sin responder no generan una sugerencia.':'Para recibir sugerencias, realizá y guardá el autodiagnóstico.');
  for(const s of d.suggestions){ensure(25);pdf.setFont(font,'normal');pdf.setFontSize(10);color(C.brown);pdf.textWithLink(s.title+` (${s.count})`,M,y,{url:s.href});y+=22}
  if(report.reflection.understood||report.reflection.help){heading('Mi reflexión (opcional)');for(const [label,value]of [['Lo que mejor comprendí',report.reflection.understood],['Lo que todavía me cuesta o quisiera consultar',report.reflection.help]]){if(!value)continue;pdf.setFont(font,'normal');pdf.setFontSize(10);const needed=pdf.splitTextToSize(safeText(value),bodyW).length*14+38;ensure(needed);text(label,M,y,10,true,C.brown);y+=17;y+=paragraph(value,M,y)+16}}
  note('Las sugerencias orientan el repaso. Páginas completadas, respuestas y reflexión son indicadores distintos; no certifican dominio matemático.');

  if(report.scope==='todo'||report.scope==='unidad0'){
  page('Mi recorrido / autoevaluación');heading('Mi autoevaluación');
  if(d.available){heading('Autodiagnóstico de entrada');note(`Incluye ${d.total} preguntas correspondientes al alcance elegido.`);
    const labels=[['correct','Correctas'],['incorrect','Para revisar'],['unknown','No sé'],['pending','Sin responder']];
    for(let i=0;i<labels.length;i++){const [key,label]=labels[i];text(String(d.totals[key]),M+i*bodyW/4,y,23,true,C.brown);text(label,M+i*bodyW/4,y+19,9,false,C.muted)}y+=46;
    for(const block of d.blocks){ensure(46);text(block.title,M,y,11,true,C.brown);y+=17;text(`${block.correct} / 4 correctas / ${block.incorrect} para revisar / ${block.unknown} No sé / ${block.pending} sin responder`,M,y,9);y+=16;rule(y);y+=12}
  }else note('Sin resultados del autodiagnóstico disponibles. No se asigna un cero a la ausencia de datos.');
  if(report.self){y+=8;heading('Autoevaluación del calentamiento');
    if(report.self.available){note(report.self.scoreDeclared?`Puntaje declarado después de autocorregirse: ${report.self.score} de 10 ejercicios.`:'No hay un puntaje declarado.');
      for(const row of report.self.confidence){ensure(35);text(row.title,M,y,10);text(row.state,W-M,y,9,false,C.brown,{align:'right'});y+=21;rule(y-11)}
      note('El puntaje y la confianza son declaraciones de la persona, separados de las respuestas del autodiagnóstico.');
    }else note('Sin autoevaluación del calentamiento guardada en esta cuenta.');
  }
  }
  report.units.forEach((unit,index)=>{if(index===0||(report.scope==='todo'&&index===2))page('Mi recorrido / detalle');heading(unit.title.replace(/ · /g,' / '));
    if(unit.legacy)note('Hay marcas de un formato anterior pendientes de recuperar. No se inventaron finalizaciones para esas páginas.');
    for(const p of unit.pages){pdf.setFont(font,'normal');pdf.setFontSize(10);const lines=pdf.splitTextToSize(safeText(p.title.replace(/ · /g,' / ')),bodyW-115);ensure(lines.length*13+6);color(C.brown);pdf.text(lines,M,y,{lineHeightFactor:1.3});pdf.link(M,y-10,bodyW-115,lines.length*13,{url:'https://utec-math.github.io'+p.href});text(p.state,W-M,y,9,p.state==='Completada',p.state==='Completada'?C.green:C.muted,{align:'right'});y+=lines.length*13+6;rule(y-9)}
    y+=12;
  });
  note('Los títulos enlazan a la plataforma. «Sin registro» indica ausencia de datos utilizables, no una respuesta incorrecta.');
  const pages=pdf.getNumberOfPages();for(let i=1;i<=pages;i++){pdf.setPage(i);rule(H-47);text('Matemática a Pedal / reporte de progreso propio',M,H-28,8,false,C.muted);text(`${i} / ${pages}`,W-M,H-28,8,false,C.muted,{align:'right'})}
  pdf.setProperties({title:'Mi recorrido - Matemática a Pedal',author:'Matemática a Pedal',subject:'Avance registrado y autoevaluación personal'});
  return pdf;
}

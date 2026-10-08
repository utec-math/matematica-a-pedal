'use strict';
// Genera los cuatro PDF a partir de las fuentes. No requiere paquetes externos.
const fs = require('node:fs');
const path = require('node:path');
const buildPDF = (function pdfFactory(){
const W=595.276,H=841.89,LEFT=48,RIGHT=547;
const latin = (s)=>Array.from(s).map(ch=>{let c=ch.charCodeAt(0);const m={8212:151,8211:150,8216:145,8217:146,8220:147,8221:148,8230:133};if(c===8800)return "distinto de";if(c===8804)return "menor o igual que";if(c===8805)return "mayor o igual que";if(c===8594)return " -> ";if(m[c])c=m[c];if(c>255)throw Error("Caracter de texto no soportado: "+ch);if(c===40||c===41||c===92)return "\\"+String.fromCharCode(c);return c>126||c<32?"\\"+c.toString(8).padStart(3,"0"):ch;}).join("");
const f=n=>Number(n.toFixed(3)).toString();
const width=(s,size,font="F1")=>Array.from(s).reduce((a,c)=>a+(/[ilI.,;:'!|]/.test(c)?0.25:/[MW@]/.test(c)?0.85:c===" "?0.28:/[0-9]/.test(c)?(font==="F3"?0.5:0.556):/[A-Z]/.test(c)?0.65:0.52)*size,0);
const textOp=(s,x,y,size=11,font="F1",color="0.16 0.19 0.23")=>`${color} rg BT /${font} ${f(size)} Tf 1 0 0 1 ${f(x)} ${f(y)} Tm (${latin(s)}) Tj ET\n`;
const symbolOp=(code,x,y,size)=>`0.16 0.19 0.23 rg BT /F5 ${f(size)} Tf 1 0 0 1 ${f(x)} ${f(y)} Tm (\\${code.toString(8).padStart(3,"0")}) Tj ET\n`;
function parseMath(src){let i=0;function group(){while(src[i]===" ")i++;if(src[i]==="{"){i++;return seq("}");}return atom();}function atom(){let ch=src[i++];if(!ch)return {type:"space",em:0};if(ch==="{")return seq("}");if(ch==="\\"){let cmd="";if(/[A-Za-z]/.test(src[i]||"")){while(/[A-Za-z]/.test(src[i]||""))cmd+=src[i++];}else cmd=src[i++]||"";
if(["left","right"].includes(cmd))return {type:"space",em:0};
if(["frac","tfrac","dfrac"].includes(cmd))return {type:"frac",a:group(),b:group()};
if(cmd==="sqrt"){let index=null;if(src[i]==="["){i++;index=seq("]");}return {type:"root",a:group(),index};}
if(cmd==="overline")return {type:"bar",a:group()};
if(cmd==="mathrm"||cmd==="text"||cmd==="mathbb")return {type:"style",a:group(),font:cmd==="mathbb"?"F2":"F3"};
if(cmd==="quad"||cmd==="qquad")return {type:"space",em:cmd==="quad"?1:2};
if([",",";"," ","!"].includes(cmd))return {type:"space",em:cmd==="!"?0:.25};
if(["sin","cos","tan","deg"].includes(cmd))return {type:"word",text:cmd+" ",font:"F3"};
const symbols={alpha:97,pi:112,theta:113,cdot:215,times:180,div:247,ne:185,le:163,ge:179,in:206,subset:204,pm:177,approx:187};
if(symbols[cmd])return {type:"sym",code:symbols[cmd]};
if(cmd==="circ")return {type:"char",char:"°",font:"F3"};
if(cmd==="ldots")return {type:"word",text:"...",font:"F3"};
if(cmd==="setminus")return {type:"char",char:"\\",font:"F3"};
if(cmd==="{"||cmd==="}")return {type:"char",char:cmd,font:"F3"};
throw Error("Comando matematico no soportado: "+cmd);
}
if(ch===" ")return {type:"space",em:.15};
return {type:"char",char:ch,font:/[A-Za-z]/.test(ch)?"F4":"F3"};}
function seq(end){let nodes=[];while(i<src.length&&(!end||src[i]!==end)){if(src[i]==="^"||src[i]==="_"){let isup=src[i++]==="^",base=nodes.pop()||{type:"space",em:0},script=group();if(base.type==="scripts")base[isup?"sup":"sub"]=script;else base={type:"scripts",a:base,[isup?"sup":"sub"]:script};nodes.push(base);}else nodes.push(atom());}if(end){if(src[i]!==end)throw Error("Grupo sin cierre: "+src);i++;}return {type:"seq",nodes};}return seq();}
function layout(node,s,forced){let n={...node};if(n.type==="space")return {...n,w:n.em*s,up:0,down:0};
if(n.type==="char"||n.type==="word"){n.font=forced||n.font;let str=n.char||n.text;return {...n,w:width(str,s,n.font)+(n.type==="char"?.6:0),up:.76*s,down:.18*s,s};}
if(n.type==="sym")return {...n,w:.65*s,up:.76*s,down:.18*s,s};
if(n.type==="style")return layout(n.a,s,n.font);
if(n.type==="seq"){n.nodes=n.nodes.map(a=>layout(a,s,forced));return {...n,w:n.nodes.reduce((v,a)=>v+a.w,0),up:Math.max(0,...n.nodes.map(a=>a.up)),down:Math.max(0,...n.nodes.map(a=>a.down)),s};}
if(n.type==="frac"){n.a=layout(n.a,s*.8,forced);n.b=layout(n.b,s*.8,forced);n.ay=s*.22+s*.2+n.a.down;n.by=s*.22-s*.2-n.b.up;return {...n,w:Math.max(n.a.w,n.b.w)+6,up:n.ay+n.a.up,down:-n.by+n.b.down,s};}
if(n.type==="scripts"){n.a=layout(n.a,s,forced);n.sup=n.sup?layout(n.sup,s*.7,forced):null;n.sub=n.sub?layout(n.sub,s*.7,forced):null;return {...n,w:n.a.w+Math.max(n.sup?.w||0,n.sub?.w||0)+1,up:Math.max(n.a.up,n.sup?s*.6+n.sup.up:0),down:Math.max(n.a.down,n.sub?s*.3+n.sub.down:0),s};}
if(n.type==="root"){n.a=layout(n.a,s,forced);n.index=n.index?layout(n.index,s*.5,forced):null;return {...n,w:n.a.w+s*.65+3,up:n.a.up+3,down:n.a.down+1,s};}
if(n.type==="bar"){n.a=layout(n.a,s,forced);return {...n,w:n.a.w,up:n.a.up+3,down:n.a.down,s};}
throw Error(n.type);}
function drawMath(n,x,y){let o="";if(n.type==="space")return o;if(n.type==="char"||n.type==="word")return textOp(n.char||n.text,x,y,n.s,n.font);if(n.type==="sym")return symbolOp(n.code,x,y,n.s);
if(n.type==="seq"){for(let a of n.nodes){o+=drawMath(a,x,y);x+=a.w;}return o;}
if(n.type==="frac"){o+=drawMath(n.a,x+(n.w-n.a.w)/2,y+n.ay);o+=drawMath(n.b,x+(n.w-n.b.w)/2,y+n.by);return o+`0.16 0.19 0.23 RG 0.6 w ${f(x+1)} ${f(y+n.s*.22)} m ${f(x+n.w-1)} ${f(y+n.s*.22)} l S\n`;}
if(n.type==="scripts"){o+=drawMath(n.a,x,y);if(n.sup)o+=drawMath(n.sup,x+n.a.w,y+n.s*.6);if(n.sub)o+=drawMath(n.sub,x+n.a.w,y-n.s*.3);return o;}
if(n.type==="root"){o+=drawMath(n.a,x+n.s*.65,y);if(n.index)o+=drawMath(n.index,x,y+n.s*.65);return o+`0.16 0.19 0.23 RG 0.8 w ${f(x)} ${f(y+n.s*.1)} m ${f(x+n.s*.18)} ${f(y-n.s*.16)} l ${f(x+n.s*.42)} ${f(y+n.a.up+2)} l ${f(x+n.w)} ${f(y+n.a.up+2)} l S\n`;}
if(n.type==="bar")return drawMath(n.a,x,y)+`0.16 0.19 0.23 RG 0.6 w ${f(x)} ${f(y+n.a.up+2)} m ${f(x+n.w)} ${f(y+n.a.up+2)} l S\n`;return o;}
function wrap(t,size,max){const words=t.split(/\s+/);let lines=[],line="";for(let w of words){const test=line?line+" "+w:w;if(width(test,size)>max&&line){lines.push(line);line=w;}else line=test;}if(line)lines.push(line);return lines;}
const hex=bytes=>bytes.map(b=>b.toString(16).padStart(2,"0")).join("");
function buildPDF(unit,png){let pages=[],ops="",y=0,overflows=[],formulaStats=[];
function page(label){if(ops)pages.push(ops);ops="";ops+=textOp("MATEMÁTICA A PEDAL",LEFT,792,10,"F2","0.48 0.25 0.06");ops+=textOp("Etapa "+unit.id+" · "+unit.title,LEFT,769,17,"F2");ops+=`q 89 0 0 ${f(89*png.h/png.w)} 462 760 cm /Logo Do Q\n`;ops+=`0.91 0.73 0.46 RG 0.7 w 48 749 m 547 749 l S\n`;ops+=textOp(label,LEFT,730,9,"F1","0.38 0.42 0.47");y=704;}
function para(t,size=11,font="F1",indent=0,color){const lines=wrap(t,size,RIGHT-LEFT-indent);for(let line of lines){if(y<78){overflows.push({page:pages.length+1,reason:"texto",text:line});throw Error("Desborde de pagina: "+unit.id+" "+line);}ops+=textOp(line,LEFT+indent,y,size,font,color);y-=size*1.48;}y-=5;}
function math(t,size=15,indent=18){let ast=parseMath(t),n=layout(ast,size);if(n.w>RIGHT-LEFT-indent){size*=((RIGHT-LEFT-indent)/n.w);n=layout(ast,size);}if(size<9)throw Error("Formula demasiado pequena: "+t);formulaStats.push({text:t,size,w:n.w});y-=n.up;ops+=drawMath(n,LEFT+indent,y);y-=n.down+12;if(y<78)throw Error("Desborde formula: "+unit.id+" "+t);}
for(let eidx=0;eidx<unit.ex.length;eidx++){const ex=unit.ex[eidx];page("PARADA DE CONTROL · SOLUCIONES PASO A PASO");para(String(eidx+1).padStart(2,"0")+"  "+ex.title,20,"F2");para("ENUNCIADO",9,"F2",0,"0.48 0.25 0.06");for(const t of ex.prompt)para(t,11);for(const m of ex.pm||[])math(m,14);y-=7;para("RESOLUCIÓN",9,"F2",0,"0.48 0.25 0.06");for(let k=0;k<ex.steps.length;k++){const [t,m,r]=ex.steps[k];para((k+1)+". "+t,11);if(m)math(m);if(r){para("Propiedades: "+r+".",8,"F1",18,"0.38 0.42 0.47");}y-=4;}
y-=6;para("COMPROBACIÓN / IDEA CLAVE",9,"F2",0,"0.48 0.25 0.06");para(ex.check,10);if(eidx===0){para("Las propiedades P1, P2, ... se resumen al final del documento.",9,"F1",0,"0.38 0.42 0.47");}}
for(let start=0;start<unit.properties.length;start+=4){page("RESUMEN DE PROPIEDADES · CONSULTA");para("Propiedades aplicadas",20,"F2");para("Usá los códigos indicados en cada paso para encontrar la regla y sus condiciones.",10);for(let j=start;j<Math.min(start+4,unit.properties.length);j++){let [id,title,t,m]=unit.properties[j];y-=6;para(id+"  "+title,13,"F2");para(t,10.5);if(m)math(m,14);y-=10;}}
if(ops)pages.push(ops);
let objs=["<< /Type /Catalog /Pages 2 0 R >>",""];const add=s=>(objs.push(s),objs.length);
const fonts=[["F1","Helvetica"],["F2","Helvetica-Bold"],["F3","Times-Roman"],["F4","Times-Italic"],["F5","Symbol"]].map(([key,name])=>[key,add("<< /Type /Font /Subtype /Type1 /BaseFont /"+name+(name==="Symbol"?"":" /Encoding /WinAnsiEncoding")+" >>")]);
let palette=png.palette.map((v,i)=>Math.round((png.alpha[Math.floor(i/3)]??255)/255*v+(1-(png.alpha[Math.floor(i/3)]??255)/255)*255));
const imgStream=hex(png.idat)+">\n";const logoId=add("<< /Type /XObject /Subtype /Image /Width "+png.w+" /Height "+png.h+" /ColorSpace [/Indexed /DeviceRGB "+(palette.length/3-1)+" <"+hex(palette)+">] /BitsPerComponent 8 /Filter [/ASCIIHexDecode /FlateDecode] /DecodeParms [null << /Predictor 15 /Colors 1 /BitsPerComponent 8 /Columns "+png.w+" >>] /Length "+imgStream.length+" >>\nstream\n"+imgStream+"endstream");
const kids=[];for(let p=0;p<pages.length;p++){const footer=textOp("Matemática a Pedal · Etapa "+unit.id+" · Solucionario",LEFT,43,8,"F1","0.38 0.42 0.47")+textOp((p+1)+" / "+pages.length,510,43,8,"F1","0.38 0.42 0.47");const stream=pages[p]+footer;const contentId=add("<< /Length "+stream.length+" >>\nstream\n"+stream+"endstream");const pageId=add("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 "+W+" "+H+"] /Resources << /Font << "+fonts.map(([k,id])=>"/"+k+" "+id+" 0 R").join(" ")+" >> /XObject << /Logo "+logoId+" 0 R >> >> /Contents "+contentId+" 0 R >>");kids.push(pageId);}
objs[1]="<< /Type /Pages /Kids ["+kids.map(id=>id+" 0 R").join(" ")+"] /Count "+kids.length+" >>";
const infoId=add("<< /Title ("+latin("Etapa "+unit.id+" - "+unit.title+" - Soluciones paso a paso")+") /Author (Matematica a Pedal) /Subject (Parada de control: soluciones explicadas y propiedades) /Creator (Matematica a Pedal) >>");
let pdf="%PDF-1.4\n% ASCII-compatible document\n",offsets=[0];objs.forEach((o,i)=>{offsets.push(pdf.length);pdf+=(i+1)+" 0 obj\n"+o+"\nendobj\n";});const xref=pdf.length;pdf+="xref\n0 "+(objs.length+1)+"\n0000000000 65535 f \n"+offsets.slice(1).map(x=>String(x).padStart(10,"0")+" 00000 n \n").join("")+"trailer\n<< /Size "+(objs.length+1)+" /Root 1 0 R /Info "+infoId+" 0 R >>\nstartxref\n"+xref+"\n%%EOF\n";if(/[^\x00-\x7f]/.test(pdf))throw Error("PDF no ASCII");return {pdf,pages:pages.length,formulaStats,overflows};}
return buildPDF;
})();

const root = path.resolve(__dirname, '..');
const source = JSON.parse(fs.readFileSync(path.join(__dirname, 'contenidos.json'), 'utf8'));
const bytes = Array.from(fs.readFileSync(path.join(root, 'assets', 'bici-espiral.png')));
const u32 = i => bytes[i]*16777216+(bytes[i+1]<<16)+(bytes[i+2]<<8)+bytes[i+3];
if(bytes.slice(0,8).join(',')!=='137,80,78,71,13,10,26,10'||bytes[24]!==8||bytes[25]!==3)throw Error('El logo debe ser PNG indexado de 8 bits; revisar el generador si cambia el logo.');
const png={w:u32(16),h:u32(20),idat:[],palette:[],alpha:[]};
for(let p=8;p<bytes.length;){const size=u32(p),type=String.fromCharCode(...bytes.slice(p+4,p+8)),data=bytes.slice(p+8,p+8+size);if(type==='IDAT')png.idat.push(...data);if(type==='PLTE')png.palette=data;if(type==='tRNS')png.alpha=data;p+=12+size;}
const output=path.join(root,'descargas');
fs.mkdirSync(output,{recursive:true});
for(const unit of source.units){
  const result=buildPDF(unit,png);
  const filename='etapa-'+unit.id+'-soluciones-paso-a-paso.pdf';
  fs.writeFileSync(path.join(output,filename),result.pdf,'ascii');
  process.stdout.write(filename+': '+result.pages+' páginas\n');
}

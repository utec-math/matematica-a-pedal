import {units} from './report-catalog.mjs';
import {questions,topics,questionReviewTopics,reviewTopics,diagnosticVersion} from './autodiagnostico-catalog.mjs';
import {cleanRecord,confidenceTopics,confidenceKeys} from './report-records.mjs';
export {units};
export function selectedUnits(scope){
  if(scope==='todo')return units;
  const unit=units.find(u=>u.id===scope);if(!unit)throw Error('Elegí un alcance válido.');return [unit];
}
export function diagnosticSummary(record,scope='todo'){
  const selected=selectedUnits(scope),source=cleanRecord('diagnostic',record);
  const indices=new Set(selected.map(u=>units.indexOf(u)));
  const totals={correct:0,incorrect:0,unknown:0,pending:0},blocks=selected.map(u=>({title:topics[units.indexOf(u)],correct:0,incorrect:0,unknown:0,pending:0}));
  const signals=new Map();
  if(source)questions.forEach((q,i)=>{
    const block=Math.floor(i/4);if(!indices.has(block))return;
    const answer=source.answers[i];
    const status=answer===null?'pending':answer==='unknown'?'unknown':answer===q.answer?'correct':'incorrect';
    totals[status]++;blocks[[...indices].indexOf(block)][status]++;
    if(status==='incorrect'||status==='unknown'){
      const key=questionReviewTopics[i];if(!signals.has(key))signals.set(key,{key,count:0,incorrect:0,unknown:0});
      const signal=signals.get(key);signal.count++;signal[status]++;
    }
  });
  const suggestions=[...signals.values()].sort((a,b)=>b.count-a.count).slice(0,3).map(s=>({...s,title:reviewTopics[s.key][0],href:'https://utec-math.github.io/matematica-a-pedal/'+reviewTopics[s.key][1]}));
  return {available:!!source,total:selected.length*4,totals,blocks,suggestions,savedAt:source?.savedAt||null,version:diagnosticVersion};
}
export function buildReport({scope='todo',progress={},diagnostic=null,self=null,name='Estudiante',reflection={},issuedAt=Date.now()}){
  const selected=selectedUnits(scope);
  const rows=selected.map(unit=>{
    const data=progress[unit.id],legacy=!!data&&Number(data.progressModelVersion)<2&&(data.checked?.length||0)>0;
    const completed=new Set(Array.isArray(data?.completedPages)?data.completedPages.filter(x=>unit.pages.some(p=>p.id===x)):[]);
    const available=!!data&&!legacy;
    const pages=unit.pages.map(p=>({...p,state:completed.has(p.id)?'Completada':available?'Por completar':legacy?'Registro antiguo':'Sin registro'}));
    return {...unit,pages,available,legacy,done:completed.size,total:pages.length};
  });
  const total=rows.reduce((n,u)=>n+u.total,0),done=rows.reduce((n,u)=>n+u.done,0);
  const missing=rows.reduce((n,u)=>n+(u.available?0:u.pages.filter(p=>p.state!=='Completada').length),0);
  const assessment=cleanRecord('self',self);
  const confidence=assessment?confidenceKeys.map((key,i)=>({title:confidenceTopics[i],state:{ok:'Me siento seguro/a',mid:'En proceso',no:'Necesito repasar'}[assessment.confidence[key]]||'Sin declarar'})):[];
  return {scope,scopeTitle:scope==='todo'?'Todo el recorrido':selected[0].title,name:String(name||'Estudiante').trim().slice(0,100),issuedAt,
    units:rows,total,done,missing,pending:total-done-missing,percent:Math.round(100*done/total),
    diagnostic:diagnosticSummary(diagnostic,scope),self:scope==='todo'||scope==='unidad0'?{available:!!assessment,scoreDeclared:!!assessment?.scoreDeclared,score:assessment?.correctItems.length||0,confidence}:null,
    reflection:{understood:String(reflection.understood||'').trim().slice(0,600),help:String(reflection.help||'').trim().slice(0,600)}};
}

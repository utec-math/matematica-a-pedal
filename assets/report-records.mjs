import {questions,diagnosticVersion} from './autodiagnostico-catalog.mjs';
import {readAccount,writeAccount} from './account-progress.mjs';
export const RECORD_IDS=Object.freeze({diagnostic:'report-autodiagnostico-v1',self:'report-autoevaluacion-v1'});
export const confidenceKeys=['sets','props','frac','pow','sci','exp'];
export const confidenceTopics=['Conjuntos numéricos y sus relaciones','Propiedades de las operaciones','Operaciones con fracciones','Potencias y raíces','Notación científica','Exponentes negativos y fraccionarios'];
export const sessionError=()=>new Error('La cuenta cambió. Volvé a intentarlo desde tu sesión actual.');
export function cleanRecord(kind,value){
  if(!value||value.schemaVersion!==1||!Number.isFinite(value.savedAt)||value.savedAt<=0)return null;
  const base={schemaVersion:1,savedAt:value.savedAt};
  if(kind==='diagnostic'){
    if(value.contentVersion!==diagnosticVersion||!Array.isArray(value.answers)||value.answers.length!==questions.length)return null;
    if(value.answers.some(a=>a!==null&&!['a','b','c','d','unknown'].includes(a)))return null;
    return {...base,contentVersion:diagnosticVersion,answers:[...value.answers]};
  }
  if(kind!=='self'||!Array.isArray(value.correctItems)||!value.confidence||typeof value.confidence!=='object')return null;
  const correctItems=[...new Set(value.correctItems.filter(k=>/^q(?:[1-9]|10)$/.test(k)))];
  const confidence={};
  for(const k of confidenceKeys)if(['ok','mid','no'].includes(value.confidence[k]))confidence[k]=value.confidence[k];
  return {...base,correctItems,confidence,scoreDeclared:value.scoreDeclared===true};
}
export function recordKey(kind){if(!RECORD_IDS[kind])throw Error('Registro desconocido.');return `report:${kind}`}
export function newerRecord(a,b){return !a?b:!b?a:a.savedAt>b.savedAt?a:b}

// Dependencies are injected so account changes and delayed writes can be tested.
export function createAccountRecords({auth,storage,read,write,clock=()=>Date.now()}){
  let queue=Promise.resolve();
  const latest=new Map();
  const ensure=uid=>{if(!uid||auth.currentUser?.uid!==uid)throw sessionError()};
  async function load(kind,uid){
    ensure(uid);
    const cached=readAccount(storage,uid,recordKey(kind),null);
    let raw;
    try{raw=await read(uid,RECORD_IDS[kind])}catch(error){ensure(uid);return {record:cleanRecord(kind,cached?.record),pending:!!cached?.pending,offline:true,error}}
    ensure(uid);
    const remote=cleanRecord(kind,raw),local=cleanRecord(kind,cached?.record);
    const useLocal=!!cached?.pending&&local&&(!remote||local.savedAt>remote.savedAt);
    const record=useLocal?local:remote;
    writeAccount(storage,uid,recordKey(kind),{record,pending:!!useLocal});
    return {record,pending:!!useLocal,offline:false};
  }
  function save(kind,payload,uid){
    ensure(uid);
    const cached=readAccount(storage,uid,recordKey(kind),null);
    const record=cleanRecord(kind,{...payload,schemaVersion:1,contentVersion:diagnosticVersion,savedAt:Math.max(clock(),(cached?.record?.savedAt||0)+1)});
    if(!record)throw Error('No se pudo validar la autoevaluación.');
    latest.set(uid+':'+kind,record.savedAt);
    writeAccount(storage,uid,recordKey(kind),{record,pending:true});
    const task=queue.catch(()=>{}).then(async()=>{
      ensure(uid);
      if(latest.get(uid+':'+kind)!==record.savedAt)return record;
      await write(uid,RECORD_IDS[kind],record);
      ensure(uid);
      if(readAccount(storage,uid,recordKey(kind),null)?.record?.savedAt===record.savedAt)writeAccount(storage,uid,recordKey(kind),{record,pending:false});
      return record;
    });
    queue=task;return task;
  }
  async function forReport(kind,uid){
    ensure(uid);await queue.catch(()=>{});ensure(uid);
    const state=await load(kind,uid);
    if(state.offline)throw Error('No se pudo consultar el registro guardado. Revisá tu conexión y volvé a descargar.');
    if(state.pending&&state.record){await save(kind,state.record,uid);ensure(uid)}
    const value=cleanRecord(kind,await read(uid,RECORD_IDS[kind]));ensure(uid);return value;
  }
  return {load,save,forReport};
}

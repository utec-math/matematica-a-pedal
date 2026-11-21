import {createReportStore,waitForMAP} from './report-account-store.mjs';
const scores=[...document.querySelectorAll('.u0-ans')];
const boxes=[...document.querySelectorAll('#u0-checklist .u0-box')];
const status=document.getElementById('u0-status');
let uid=null,version=0,map,store,ready=false,scoreDeclared=false,saveVersion=0;
const all=[...scores,...boxes];
function update(){
  const count=scores.filter(x=>x.checked).length;
  document.getElementById('u0-score-label').textContent=`${count}/10 · ${count*10}%`;
  document.getElementById('u0-score-bar').style.width=`${count*10}%`;
}
function payload(){
  const confidence={};for(const input of boxes)if(input.checked)confidence[input.dataset.key]=input.value;
  return {correctItems:scores.filter(x=>x.checked).map(x=>x.dataset.key),confidence,scoreDeclared};
}
function persist(){
  if(!uid||!ready)return;const owner=uid,epoch=version,request=++saveVersion;
  if(map.auth.currentUser?.uid!==owner){bind(map.auth.currentUser,true);return}
  status.textContent='Guardando…';
  store.save('self',payload(),owner).then(()=>{if(epoch===version&&request===saveVersion)status.textContent='Autoevaluación guardada en tu cuenta.'}).catch(()=>{if(epoch===version&&request===saveVersion)status.textContent='No se pudo confirmar el guardado. Revisá tu conexión.'});
}
function offerLegacy(){
  document.getElementById('self-legacy-import')?.remove();
  let oldScore,oldConfidence;
  try{if(localStorage.getItem('map:self-legacy-assigned-to'))return;oldScore=JSON.parse(localStorage.getItem('mp-u0-score-v1')||'null');oldConfidence=JSON.parse(localStorage.getItem('mp-u0-checklist-v1')||'null')}catch{return}
  if(!oldScore&&!oldConfidence)return;
  const section=document.createElement('div');section.id='self-legacy-import';section.style.cssText='margin:16px 0;padding:14px;border:1px solid #FFD580;border-radius:10px;background:#FFF6E6';
  const p=document.createElement('p');p.textContent='Hay marcas antiguas en este navegador. Solo recuperalas en esta cuenta si te pertenecen. Los originales se conservan.';
  const check=document.createElement('input');check.type='checkbox';const label=document.createElement('label');label.append(check,document.createTextNode(' Confirmo que las marcas antiguas son mías.'));
  const button=document.createElement('button');button.type='button';button.textContent='Recuperar mi autoevaluación';button.disabled=true;check.onchange=()=>button.disabled=!check.checked;
  button.onclick=async()=>{
    const owner=uid,epoch=version;if(!ready||!check.checked||map.auth.currentUser?.uid!==owner)return;
    button.disabled=true;const current=payload();
    const value={correctItems:[...new Set([...Object.keys(oldScore||{}).filter(k=>oldScore[k]===true),...current.correctItems])],confidence:{...oldConfidence,...current.confidence},scoreDeclared:current.scoreDeclared||!!oldScore};
    try{await store.save('self',value,owner);if(version!==epoch)return;localStorage.setItem('map:self-legacy-assigned-to',owner);section.remove();await bind(map.auth.currentUser,true)}catch{if(epoch===version){status.textContent='No se pudo recuperar ahora. Los originales siguen guardados.';button.disabled=false}}
  };
  section.append(p,label,button);status.after(section);
}
async function bind(user,force=false){
  if(!force&&uid===user?.uid&&ready)return;
  const epoch=++version;uid=user?.uid||null;ready=false;scoreDeclared=false;all.forEach(x=>{x.checked=false;x.disabled=true});update();
  if(!uid){status.textContent='Sin una sesión activa no se guardan las marcas.';return}
  try{
    const state=await store.load('self',uid);if(epoch!==version)return;
    const data=state.record;
    scoreDeclared=!!data?.scoreDeclared;
    scores.forEach(x=>x.checked=!!data?.correctItems.includes(x.dataset.key));
    boxes.forEach(x=>x.checked=data?.confidence[x.dataset.key]===x.value);
    all.forEach(x=>x.disabled=false);ready=true;update();
    status.textContent=state.offline?'Mostrando las marcas de esta cuenta en este navegador. Falta sincronizar.':'Las marcas se guardan en esta cuenta.';
    offerLegacy();
  }catch(error){if(epoch===version)status.textContent=error.message}
}
all.forEach(x=>x.addEventListener('change',()=>{if(scores.includes(x))scoreDeclared=true;update();persist()}));
document.getElementById('u0-score-calc').onclick=()=>{scoreDeclared=true;update();persist()};
document.getElementById('u0-score-reset').onclick=()=>{if(!ready)return;scoreDeclared=true;scores.forEach(x=>x.checked=false);update();persist()};
document.getElementById('u0-reset').onclick=()=>{if(!ready)return;boxes.forEach(x=>x.checked=false);persist()};
document.getElementById('u0-print').onclick=()=>window.print();
all.forEach(x=>x.disabled=true);
waitForMAP().then(value=>{map=value;store=createReportStore(map);map.onAuthStateChanged(map.auth,user=>bind(user));window.addEventListener('map:account-ready',()=>bind(map.auth.currentUser,true))}).catch(()=>{status.textContent='No se pudo preparar el guardado. Probá recargar.'});

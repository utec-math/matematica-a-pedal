import {doc,getDocFromServer} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {waitForMAP,createReportStore} from './report-account-store.mjs';
import {buildReport,units,selectedUnits} from './report-model.mjs';
import {renderReportPDF} from './report-pdf.mjs';
const $=id=>document.getElementById(id);
const scope=$('report-scope'),button=$('report-download'),status=$('report-status');
for(const unit of units){const option=document.createElement('option');option.value=unit.id;option.textContent=unit.title;scope.append(option)}
let map,store,epoch=0,uid=null,busy=false;
const fields=['report-name','report-understood','report-help'];
function bind(user,force=false){
  if(!force&&user?.uid===uid)return;
  ++epoch;uid=user?.uid||null;busy=false;
  fields.forEach(id=>$(id).value='');$('report-name').value=user?.displayName||'';scope.value='todo';
  button.disabled=!user||user.isAnonymous;fields.forEach(id=>$(id).disabled=button.disabled);scope.disabled=button.disabled;
  status.textContent=button.disabled?'Iniciá sesión con Google para descargar el reporte asociado a tu cuenta.':'Elegí qué compartir. La reflexión es opcional y se incluye solo en el PDF.';
}
async function assetData(path,font=false){
  const response=await fetch(new URL(path,import.meta.url));if(!response.ok)throw Error('No se pudieron cargar los elementos del PDF. Probá de nuevo.');
  const blob=await response.blob();return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(font?reader.result.split(',')[1]:reader.result);reader.onerror=reject;reader.readAsDataURL(blob)});
}
button.addEventListener('click',async()=>{
  const user=map?.auth.currentUser;if(!user||user.isAnonymous||busy)return;
  if(user.uid!==uid){bind(user,true);status.textContent='La cuenta cambió. Revisá el alcance y la reflexión antes de descargar.';return}
  const owner=user.uid,version=epoch,current=()=>{if(epoch!==version||map.auth.currentUser?.uid!==owner)throw Error('La cuenta cambió. Volvé a generar el reporte.')};
  busy=true;button.disabled=true;status.textContent='Preparando tu reporte…';
  const chosen=scope.value,name=$('report-name').value.trim()||user.displayName||'Estudiante';
  const reflection={understood:$('report-understood').value,help:$('report-help').value};
  try{
    const selected=selectedUnits(chosen);
    const [progressEntries,diagnostic,self,logo,fontBase64,fontBoldBase64]=await Promise.all([
      Promise.all(selected.map(async unit=>{const snap=await getDocFromServer(doc(map.db,'users',owner,'progress',unit.id));return [unit.id,snap.exists()?snap.data():null]})),
      store.forReport('diagnostic',owner),
      chosen==='todo'||chosen==='unidad0'?store.forReport('self',owner):Promise.resolve(null),
      assetData('./bici-espiral.png'),assetData('./vendor/RobotoMono-Regular.ttf',true),assetData('./vendor/RobotoMono-Bold.ttf',true)
    ]);
    current();await import('./vendor/jspdf-4.2.1.umd.min.js');current();
    const report=buildReport({scope:chosen,progress:Object.fromEntries(progressEntries),diagnostic,self,name,reflection});
    const pdf=renderReportPDF(window.jspdf.jsPDF,report,{logo,fontBase64,fontBoldBase64});current();
    const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Montevideo'}).format(report.issuedAt);
    pdf.save(`matematica-a-pedal-mi-recorrido-${chosen}-${date}.pdf`);
    status.textContent='Reporte descargado. Podés entregarlo por el medio que te indique tu docente.';
  }catch(error){if(epoch===version)status.textContent=error.message||'No se pudo preparar el PDF. Revisá tu conexión y probá de nuevo.'}
  finally{if(epoch===version){busy=false;button.disabled=false}}
});
waitForMAP().then(value=>{map=value;store=createReportStore(map);map.onAuthStateChanged(map.auth,user=>bind(user));window.addEventListener('map:account-ready',()=>bind(map.auth.currentUser,true))}).catch(error=>{status.textContent=error.message});

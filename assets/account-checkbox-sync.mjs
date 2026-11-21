import {doc,getDoc,setDoc,onSnapshot,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {readAccount,writeAccount} from './account-progress.mjs';
const parts=location.pathname.split('/').filter(Boolean),last=parts.at(-1)||'index.html';
const unit=[...parts].reverse().find(part=>/^unidad\d+$/i.test(part))||'unidad0';
const UNIT_ID=last==='index.html'||/^unidad\d+$/i.test(last)?unit:last,KEY=`progress:${UNIT_ID}`;
const inputs=()=>Array.from(document.querySelectorAll('input[type="checkbox"][data-progress-id]'));
let uid=null,version=0,unsubscribe=null,saveTimer=null;
const valid=(owner,revision)=>owner&&uid===owner&&revision===version&&window.__MAP__?.auth.currentUser?.uid===owner;
function apply(ids){const set=new Set(ids);inputs().forEach(el=>el.checked=set.has(el.dataset.progressId))}
async function bind(user){
  const revision=++version;uid=user?.uid||null;clearTimeout(saveTimer);unsubscribe?.();unsubscribe=null;
  const local=readAccount(localStorage,uid,KEY,[]);apply(Array.isArray(local)?local:[]);
  if(!user)return;
  const owner=user.uid,map=window.__MAP__,ref=doc(map.db,'users',owner,'progress',UNIT_ID);
  try{
    const snap=await getDoc(ref);if(!valid(owner,revision))return;
    const remote=Array.isArray(snap.data()?.checked)?snap.data().checked:[];
    if(!remote.length&&Array.isArray(local)&&local.length)await setDoc(ref,{checked:local,updatedAt:Date.now(),ts:serverTimestamp()},{merge:true});
    else{apply(remote);writeAccount(localStorage,owner,KEY,remote)}
    if(!valid(owner,revision))return;
    unsubscribe=onSnapshot(ref,snapshot=>{
      if(!valid(owner,revision))return;
      const ids=Array.isArray(snapshot.data()?.checked)?snapshot.data().checked:[];
      apply(ids);writeAccount(localStorage,owner,KEY,ids);
    },error=>console.warn('No se pudo sincronizar el progreso de esta cuenta.',error));
  }catch(error){if(valid(owner,revision))console.warn('No se pudo cargar el progreso de esta cuenta.',error)}
}
Array.from(document.querySelectorAll('input[type="checkbox"]')).forEach((el,index)=>{
  if(el.classList.contains('u0-ans'))return;
  if(!el.dataset.progressId)el.dataset.progressId=`${UNIT_ID}-chk-${String(index+1).padStart(2,'0')}`;
  el.addEventListener('change',()=>{
    const owner=uid,revision=version;if(!valid(owner,revision))return;
    const ids=inputs().filter(input=>input.checked).map(input=>input.dataset.progressId);
    writeAccount(localStorage,owner,KEY,ids);clearTimeout(saveTimer);
    saveTimer=setTimeout(async()=>{
      if(!valid(owner,revision))return;
      try{await setDoc(doc(window.__MAP__.db,'users',owner,'progress',UNIT_ID),{checked:ids,updatedAt:Date.now(),ts:serverTimestamp()},{merge:true})}
      catch(error){console.warn('El progreso quedó guardado en esta cuenta del navegador.',error)}
    },600);
  });
});
apply([]);
const started=Date.now(),timer=setInterval(()=>{
  if(window.__MAP__?.auth){clearInterval(timer);window.__MAP__.onAuthStateChanged(window.__MAP__.auth,bind)}
  else if(Date.now()-started>10000){clearInterval(timer);console.warn('No se pudo inicializar el progreso.')}
},100);

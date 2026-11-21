import {legacyKeys,claimLegacy} from './account-progress.mjs';
export function offerLegacyImport(user,onImported){
  document.getElementById('legacy-import')?.remove();
  if(!user)return;
  try{if(!legacyKeys(localStorage).length||localStorage.getItem('map:legacy-assigned-to'))return}catch{return}
  const section=document.createElement('section');section.id='legacy-import';section.style.cssText='margin:18px 0;padding:18px;border:1px solid #b88649;border-radius:12px;background:#fff5e3';
  const title=document.createElement('h2');title.textContent='Encontramos avances antiguos en este navegador';
  const p=document.createElement('p');p.textContent=`Todavía no sabemos a qué persona corresponden. Solo recuperalos si son tuyos. Se asignarán a ${user.email||'tu sesión de visitante actual'}; no se borran los originales ni se importa tiempo de estudio.`;
  const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';label.append(check,document.createTextNode(' Confirmo que esos avances me pertenecen y quiero asignarlos a esta cuenta.'));
  const button=document.createElement('button');button.type='button';button.textContent='Recuperar mis avances';button.disabled=true;button.style.cssText='display:block;margin-top:14px;padding:9px 14px';
  check.onchange=()=>button.disabled=!check.checked;
  const message=document.createElement('p');message.setAttribute('role','status');
  button.onclick=async()=>{if(window.__MAP__?.auth.currentUser?.uid!==user.uid){message.textContent='La cuenta cambió. Volvé a abrir Mi progreso.';return}try{claimLegacy(localStorage,user.uid,check.checked);section.remove();await onImported();window.dispatchEvent(new Event('map:progress-updated'))}catch(error){message.textContent=error.message}};
  section.append(title,p,label,button,message);document.getElementById('progress-identity')?.after(section);
}

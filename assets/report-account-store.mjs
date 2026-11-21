import {doc,getDocFromServer,runTransaction,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {createAccountRecords} from './report-records.mjs';
export async function waitForMAP(){
  const end=Date.now()+15000;
  while(!window.__MAP__?.auth||!window.__MAP__?.db){if(Date.now()>end)throw Error('No se pudo preparar tu sesión. Probá recargar.');await new Promise(r=>setTimeout(r,100))}
  await window.__MAP__.authReady;return window.__MAP__;
}
export function createReportStore(map){
  return createAccountRecords({auth:map.auth,storage:localStorage,
    read:async(uid,id)=>{const s=await getDocFromServer(doc(map.db,'users',uid,'progress',id));return s.exists()?s.data():null},
    write:async(uid,id,record)=>{
      const ref=doc(map.db,'users',uid,'progress',id);
      await runTransaction(map.db,async tx=>{
        if(map.auth.currentUser?.uid!==uid)throw Error('La cuenta cambió. Volvé a intentarlo.');
        const prior=await tx.get(ref);
        if((prior.data()?.savedAt||0)>record.savedAt)throw Error('Hay una autoevaluación más reciente. Recargá antes de modificarla.');
        tx.set(ref,{...record,ts:serverTimestamp()});
      });
    }
  });
}

// No se atribuyen claves antiguas sin una decisión explícita de la persona.
export function accountKey(uid,key){return uid?`map:account:${encodeURIComponent(uid)}:${key}`:null}
export function readAccount(storage,uid,key,fallback){try{const k=accountKey(uid,key);return k?JSON.parse(storage.getItem(k)||'null')??fallback:fallback}catch{return fallback}}
export function writeAccount(storage,uid,key,value){const k=accountKey(uid,key);if(!k)return false;try{storage.setItem(k,JSON.stringify(value));return true}catch{return false}}
export function removeAccount(storage,uid,key){const k=accountKey(uid,key);if(k)try{storage.removeItem(k)}catch{}}
export function legacyKeys(storage){const keys=[];for(let i=0;i<storage.length;i++){const k=storage.key(i);if(k&&/^(progress:|map:completed:)/.test(k))keys.push(k)}return keys}
export function claimLegacy(storage,uid,consent){
  if(!uid||consent!==true)throw Error('Necesitás confirmar a qué cuenta corresponde el avance.');
  const previous=storage.getItem('map:legacy-assigned-to');
  if(previous&&previous!==uid)throw Error('Los avances antiguos ya se asignaron a otra cuenta de este navegador.');
  for(const key of legacyKeys(storage)){
    let source;try{source=JSON.parse(storage.getItem(key))}catch{continue}
    if(!Array.isArray(source))continue;
    const current=readAccount(storage,uid,key,[]);
    if(!writeAccount(storage,uid,key,[...new Set([...(Array.isArray(current)?current:[]),...source.filter(x=>typeof x==='string')])]))throw Error('No se pudo guardar la recuperación. Los originales se conservan.');
    if(/^progress:unidad[0-4]$/.test(key))writeAccount(storage,uid,`map:legacy-pending:${key.slice(9)}`,true);
  }
  storage.setItem('map:legacy-assigned-to',uid);
}

// Adaptador compartido entre el panel y las pruebas de integración.
// El SDK se inyecta para usar la misma lógica en navegador y emulador.
export function firestoreStore(db,sdk){
  const value=snap=>snap.exists()?{...snap.data(),id:snap.id}:null;
  const ref=path=>sdk.doc(db,path);
  const query=(path,{field,value,after,limit=21}={})=>{
    const constraints=[];if(field)constraints.push(sdk.where(field,'==',value));
    constraints.push(sdk.orderBy(sdk.documentId()));if(after)constraints.push(sdk.startAfter(after));
    constraints.push(sdk.limit(limit));return sdk.query(sdk.collection(db,path),...constraints);
  };
  return {
    get:async path=>value(await sdk.getDocFromServer(ref(path))),
    list:async(path,options)=>(await sdk.getDocsFromServer(query(path,options))).docs.map(value),
    count:async(path,limit)=>(await sdk.getCountFromServer(query(path,{limit}))).data().count,
    set:(path,data,options)=>options?sdk.setDoc(ref(path),data,options):sdk.setDoc(ref(path),data),
    timestamp:()=>sdk.serverTimestamp(),date:ms=>sdk.Timestamp.fromMillis(ms),
    digest:async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),n=>n.toString(16).padStart(2,'0')).join(''),
    transaction:fn=>sdk.runTransaction(db,tx=>fn({get:async path=>value(await tx.get(ref(path))),set:(path,data)=>tx.set(ref(path),data),update:(path,data)=>tx.update(ref(path),data),delete:path=>tx.delete(ref(path))}))
  };
}

import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import {getAuth,connectAuthEmulator,setPersistence,browserSessionPersistence,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import * as firestore from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {createSparkClient} from '../spark/client.mjs';
import {catalog} from './catalog.mjs';
import {environment,assertTestEnvironment} from './environment.mjs';
assertTestEnvironment(location);
const app=initializeApp(environment,'teaching-test');
const auth=getAuth(app);connectAuthEmulator(auth,`http://${environment.host}:9099`,{disableWarnings:false});
const db=firestore.initializeFirestore(app,{localCache:firestore.memoryLocalCache()});
firestore.connectFirestoreEmulator(db,environment.host,8080);
await setPersistence(auth,browserSessionPersistence);
const value=snap=>snap.exists()?{...snap.data(),id:snap.id}:null;
const ref=path=>firestore.doc(db,path);
function query(path,{field,value,after,limit=21}={}){
  const constraints=[];if(field)constraints.push(firestore.where(field,'==',value));
  constraints.push(firestore.orderBy(firestore.documentId()));if(after)constraints.push(firestore.startAfter(after));
  constraints.push(firestore.limit(limit));return firestore.query(firestore.collection(db,path),...constraints);
}
const store={
  get:async path=>value(await firestore.getDocFromServer(ref(path))),
  list:async(path,options)=>(await firestore.getDocsFromServer(query(path,options))).docs.map(value),
  count:async(path,limit)=>(await firestore.getCountFromServer(query(path,{limit}))).data().count,
  set:(path,data,options)=>options?firestore.setDoc(ref(path),data,options):firestore.setDoc(ref(path),data),
  timestamp:()=>firestore.serverTimestamp(),date:ms=>firestore.Timestamp.fromMillis(ms),
  digest:async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),n=>n.toString(16).padStart(2,'0')).join(''),
  transaction:fn=>firestore.runTransaction(db,tx=>fn({get:async path=>value(await tx.get(ref(path))),set:(path,data)=>tx.set(ref(path),data),update:(path,data)=>tx.update(ref(path),data),delete:path=>tx.delete(ref(path))}))
};
const client=createSparkClient(store,{catalog,currentUser:()=>auth.currentUser});
export const api={
  observe:fn=>onAuthStateChanged(auth,fn),
  login:()=>signInWithPopup(auth,new GoogleAuthProvider()),logout:()=>signOut(auth),
  call:(action,payload={})=>client.call(action,payload)
};

import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import {getAuth,connectAuthEmulator,setPersistence,browserSessionPersistence,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import * as firestore from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {firestoreStore} from '../spark/firestore-store.mjs';
import {createSparkClient} from '../spark/client.mjs';
import {catalog} from './catalog.mjs';
import {environment,assertTestEnvironment} from './environment.mjs';
const mode=assertTestEnvironment(location);
let auth,db,login,logout,observe;
if(mode==='site'){
  // Reutilizar la sesión y migración anónimo→Google del recorrido, sin otra cuenta.
  await import('../assets/firebase-init.js');
  const map=window.__MAP__;await map.authReady;auth=map.auth;db=map.db;
  login=()=>map.signInWithGoogle();logout=()=>map.signOut();
  observe=fn=>map.onIdTokenChanged(auth,u=>fn(u?.isAnonymous?null:u));
}else{
  const app=initializeApp(environment,'teaching-test');auth=getAuth(app);
  connectAuthEmulator(auth,`http://${environment.host}:9099`,{disableWarnings:false});
  db=firestore.initializeFirestore(app,{localCache:firestore.memoryLocalCache()});
  firestore.connectFirestoreEmulator(db,environment.host,8080);
  await setPersistence(auth,browserSessionPersistence);
  login=()=>signInWithPopup(auth,new GoogleAuthProvider());logout=()=>signOut(auth);
  observe=fn=>onAuthStateChanged(auth,u=>fn(u?.isAnonymous?null:u));
}
const store=firestoreStore(db,firestore);
const client=createSparkClient(store,{catalog,currentUser:()=>auth.currentUser});
export const api={
  observe,login,logout,
  call:(action,payload={})=>client.call(action,payload)
};

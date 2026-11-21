import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import {getAuth,connectAuthEmulator,setPersistence,browserSessionPersistence,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import * as firestore from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {firestoreStore} from '../spark/firestore-store.mjs';
import {createSparkClient} from '../spark/client.mjs';
import {catalog} from './catalog.mjs';
import {environment,assertTestEnvironment} from './environment.mjs';
assertTestEnvironment(location);
const app=initializeApp(environment,'teaching-test');
const auth=getAuth(app);connectAuthEmulator(auth,`http://${environment.host}:9099`,{disableWarnings:false});
const db=firestore.initializeFirestore(app,{localCache:firestore.memoryLocalCache()});
firestore.connectFirestoreEmulator(db,environment.host,8080);
await setPersistence(auth,browserSessionPersistence);
const store=firestoreStore(db,firestore);
const client=createSparkClient(store,{catalog,currentUser:()=>auth.currentUser});
export const api={
  observe:fn=>onAuthStateChanged(auth,fn),
  login:()=>signInWithPopup(auth,new GoogleAuthProvider()),logout:()=>signOut(auth),
  call:(action,payload={})=>client.call(action,payload)
};

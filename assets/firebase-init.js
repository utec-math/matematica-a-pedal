// assets/firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAEOIDc1ldO0P2Y3c0vKhap0jDDM59PdFQ",
  authDomain: "matematica-a-pedal.firebaseapp.com",
  projectId: "matematica-a-pedal",
  storageBucket: "matematica-a-pedal.firebasestorage.app",
  messagingSenderId: "323411578025",
  appId: "1:323411578025:web:f6fe406953ae7fab99edb8",
  measurementId: "G-ZY88YE7ZJJ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

enableIndexedDbPersistence(db).catch(() => {});

// Login anónimo por defecto (sitio abierto)
signInAnonymously(auth).catch(() => {});

// Google Provider
const provider = new GoogleAuthProvider();
// opcional: sugerir dominio
provider.setCustomParameters({ hd: "estudiantes.utec.edu.uy" });

const allowedDomain = "@estudiantes.utec.edu.uy";
function isAllowedEmail(email) {
  return typeof email === "string" && email.toLowerCase().endsWith(allowedDomain);
}

// “Ingresar para certificado”
async function signInForCertificate() {
  const u = auth.currentUser;

  // si está anónimo → linkea (conserva UID y progreso)
  const cred = (u && u.isAnonymous)
    ? await linkWithPopup(u, provider)
    : await signInWithPopup(auth, provider);

  const email = cred.user?.email || "";
  if (!isAllowedEmail(email)) {
    await signOut(auth);
    throw new Error("Solo cuentas @estudiantes.utec.edu.uy pueden acceder al certificado.");
  }

  return cred.user;
}

window.__MAP__ = {
  app, auth, db, onAuthStateChanged,
  signInForCertificate,
  signOut: () => signOut(auth),
  isAllowedEmail
};

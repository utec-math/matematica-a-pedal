// assets/firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  linkWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
  getFirestore,
  enableIndexedDbPersistence,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

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

const PENDING_MIGRATION_KEY = "map:pending-progress-migration";

enableIndexedDbPersistence(db).catch(() => {});

// Sitio abierto: conservar primero cualquier sesión persistida.
// Solo crea una cuenta anónima si Firebase confirma que no hay usuario autenticado.
async function ensureSignedInUser() {
  await auth.authStateReady();

  if (auth.currentUser) {
    return auth.currentUser;
  }

  const cred = await signInAnonymously(auth);
  return cred.user;
}

// Lee todo el progreso del UID actual antes de cambiar de identidad.
async function readProgressSnapshot(uid) {
  const snap = await getDocs(collection(db, "users", uid, "progress"));
  return snap.docs.map(d => ({
    id: d.id,
    checked: Array.isArray(d.data()?.checked) ? d.data().checked : []
  }));
}

function savePendingMigration(sourceUid, expectedEmail, progressDocs) {
  try {
    sessionStorage.setItem(PENDING_MIGRATION_KEY, JSON.stringify({
      sourceUid,
      expectedEmail: (expectedEmail || "").toLowerCase(),
      progressDocs
    }));
  } catch (err) {
    console.warn("No se pudo guardar el respaldo temporal de progreso:", err);
  }
}

function clearPendingMigration() {
  try { sessionStorage.removeItem(PENDING_MIGRATION_KEY); }
  catch (_) {}
}

async function mergeProgressIntoUser(progressDocs, targetUid) {
  for (const item of progressDocs || []) {
    const targetRef = doc(db, "users", targetUid, "progress", item.id);
    const targetSnap = await getDoc(targetRef);
    const targetChecked = targetSnap.exists() && Array.isArray(targetSnap.data()?.checked)
      ? targetSnap.data().checked
      : [];

    // El progreso es acumulativo: nunca pisamos avances existentes.
    const mergedChecked = [...new Set([...(item.checked || []), ...targetChecked])];

    await setDoc(targetRef, {
      checked: mergedChecked,
      updatedAt: Date.now(),
      ts: serverTimestamp()
    }, { merge: true });
  }
}

async function retryPendingMigration(user) {
  if (!user || user.isAnonymous || !user.email) return;

  let pending = null;
  try {
    pending = JSON.parse(sessionStorage.getItem(PENDING_MIGRATION_KEY) || "null");
  } catch (_) {
    return;
  }

  if (!pending?.progressDocs?.length) return;
  if (pending.expectedEmail && pending.expectedEmail !== user.email.toLowerCase()) return;

  try {
    await mergeProgressIntoUser(pending.progressDocs, user.uid);
    clearPendingMigration();
  } catch (err) {
    console.warn("Quedó pendiente reintentar la migración de progreso:", err);
  }
}

const authReady = ensureSignedInUser()
  .then(async (user) => {
    await retryPendingMigration(user);
    return user;
  })
  .catch((err) => {
    console.error("No se pudo inicializar Firebase Authentication:", err);
    return null;
  });

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
  await auth.authStateReady();
  const u = auth.currentUser || await authReady;

  let cred;

  if (u && u.isAnonymous) {
    try {
      // Caso ideal: Google se vincula al UID anónimo actual y el progreso queda donde está.
      cred = await linkWithPopup(u, provider);
    } catch (err) {
      if (err?.code !== "auth/credential-already-in-use") {
        throw err;
      }

      // La cuenta Google ya existe con otro UID.
      // Antes de cambiar de identidad, preservamos TODO el progreso anónimo.
      const progressDocs = await readProgressSnapshot(u.uid);
      const googleCredential = GoogleAuthProvider.credentialFromError(err);

      if (!googleCredential) {
        throw new Error("No se pudo recuperar la credencial de Google para conservar el progreso.");
      }

      const expectedEmail = err?.customData?.email || err?.email || "";
      savePendingMigration(u.uid, expectedEmail, progressDocs);

      // Firebase recomienda iniciar sesión con la credencial ya existente.
      cred = await signInWithCredential(auth, googleCredential);

      const email = cred.user?.email || "";
      if (!isAllowedEmail(email)) {
        await signOut(auth);
        throw new Error("Solo cuentas @estudiantes.utec.edu.uy pueden acceder al certificado.");
      }

      // Une avances del UID anónimo y del UID Google, sin borrar ninguno.
      await mergeProgressIntoUser(progressDocs, cred.user.uid);
      clearPendingMigration();
    }
  } else {
    cred = await signInWithPopup(auth, provider);
  }

  const email = cred.user?.email || "";
  if (!isAllowedEmail(email)) {
    await signOut(auth);
    throw new Error("Solo cuentas @estudiantes.utec.edu.uy pueden acceder al certificado.");
  }

  return cred.user;
}

window.__MAP__ = {
  app, auth, db, onAuthStateChanged,
  authReady,
  signInForCertificate,
  signOut: () => signOut(auth),
  isAllowedEmail
};

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

function normalizeMeta(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function mergeCompletionMeta(sourceMeta, targetMeta) {
  const source = normalizeMeta(sourceMeta);
  const target = normalizeMeta(targetMeta);
  const merged = { ...source, ...target };

  for (const key of new Set([...Object.keys(source), ...Object.keys(target)])) {
    const s = normalizeMeta(source[key]);
    const t = normalizeMeta(target[key]);
    const completedDates = [
      Number(s.completedAt) || 0,
      Number(t.completedAt) || 0
    ].filter(Boolean);

    merged[key] = {
      ...s,
      ...t,
      activeSeconds: Math.max(Number(s.activeSeconds) || 0, Number(t.activeSeconds) || 0),
      maxScroll: Math.max(Number(s.maxScroll) || 0, Number(t.maxScroll) || 0),
      // completedAt representa la primera finalización conocida, no la más reciente.
      completedAt: completedDates.length ? Math.min(...completedDates) : undefined
    };

    if (merged[key].completedAt === undefined) delete merged[key].completedAt;
  }

  return merged;
}

// Lee todo el progreso del UID actual antes de cambiar de identidad.
async function readProgressSnapshot(uid) {
  const snap = await getDocs(collection(db, "users", uid, "progress"));
  return snap.docs.map(d => {
    const data = d.data() || {};
    return {
      id: d.id,
      checked: Array.isArray(data.checked) ? data.checked : [],
      completedPages: Array.isArray(data.completedPages) ? data.completedPages : [],
      completionMeta: normalizeMeta(data.completionMeta),
      progressModelVersion: Number(data.progressModelVersion) || 0
    };
  });
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
    const targetData = targetSnap.exists() ? targetSnap.data() : {};

    const targetChecked = Array.isArray(targetData?.checked) ? targetData.checked : [];
    const targetCompleted = Array.isArray(targetData?.completedPages) ? targetData.completedPages : [];

    // El progreso es acumulativo: nunca pisamos avances existentes.
    const mergedChecked = [...new Set([...(item.checked || []), ...targetChecked])];
    const mergedCompleted = [...new Set([...(item.completedPages || []), ...targetCompleted])];
    const mergedMeta = mergeCompletionMeta(item.completionMeta, targetData?.completionMeta);

    const sourceVersion = Number(item.progressModelVersion) || 0;
    const targetVersion = Number(targetData?.progressModelVersion) || 0;
    const hasUnmigratedLegacyProgress =
      ((item.checked || []).length > 0 && sourceVersion < 2) ||
      (targetChecked.length > 0 && targetVersion < 2);

    // Si alguno de los dos UID todavía trae marcas del esquema antiguo,
    // dejamos la versión pendiente para que el panel las convierta una sola vez.
    const mergedVersion = hasUnmigratedLegacyProgress
      ? 0
      : Math.max(sourceVersion, targetVersion);

    await setDoc(targetRef, {
      checked: mergedChecked,
      completedPages: mergedCompleted,
      completionMeta: mergedMeta,
      progressModelVersion: mergedVersion,
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

// Google Provider: se permite elegir cuenta para admitir estudiantes y personal UTEC.
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

const allowedDomains = [
  "@estudiantes.utec.edu.uy",
  "@utec.edu.uy"
];

function isAllowedEmail(email) {
  if (typeof email !== "string") return false;
  const normalizedEmail = email.toLowerCase();
  return allowedDomains.some(domain => normalizedEmail.endsWith(domain));
}

// Inicio de sesión institucional UTEC.
// Si el usuario era anónimo, intenta vincular Google al mismo UID para conservar progreso.
async function signInWithUtec() {
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

      // Inicia sesión con la cuenta Google ya existente.
      cred = await signInWithCredential(auth, googleCredential);

      const email = cred.user?.email || "";
      if (!isAllowedEmail(email)) {
        await signOut(auth);
        throw new Error("Solo cuentas institucionales UTEC pueden iniciar sesión.");
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
    throw new Error("Solo cuentas institucionales UTEC pueden iniciar sesión.");
  }

  return cred.user;
}

window.__MAP__ = {
  app, auth, db, onAuthStateChanged,
  authReady,
  signInWithUtec,
  signOut: () => signOut(auth),
  isAllowedEmail
};

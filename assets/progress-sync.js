// assets/progress-sync.js
import {
  doc, getDoc, setDoc, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// Detectar correctamente la unidad/página desde la URL.
// En las portadas (index.html o /unidadN/) el documento de progreso debe ser unidadN.
// En otras páginas se conserva el nombre del archivo (por ejemplo mini-evaluacion.html).
const pathParts = location.pathname.split('/').filter(Boolean);
const lastPart = pathParts[pathParts.length - 1] || 'index.html';
const unitFolder = [...pathParts].reverse().find(part => /^unidad\d+$/i.test(part)) || 'unidad0';
const UNIT_ID = (lastPart === 'index.html' || /^unidad\d+$/i.test(lastPart))
  ? unitFolder
  : lastPart;

const STORAGE_KEY = `progress:${UNIT_ID}`;
const $ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

let currentUid = null;
let unsubscribeRemote = null;
let bindVersion = 0;

// Debounce simple
const debounce = (fn, ms = 600) => {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

function readCheckedFromDOM() {
  return $('input[type="checkbox"][data-progress-id]')
    .filter(el => el.checked)
    .map(el => el.dataset.progressId);
}

function applyCheckedToDOM(ids = []) {
  const set = new Set(ids);
  $('input[type="checkbox"][data-progress-id]').forEach(el => {
    el.checked = set.has(el.dataset.progressId);
  });
}

// Fallback local
function saveLocal(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}
function loadLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

// Guardar remoto usando SIEMPRE el UID actualmente autenticado.
const saveRemote = debounce(async (ids) => {
  const uid = currentUid;
  if (!uid || !window.__MAP__?.db) return;

  const ref = doc(window.__MAP__.db, 'users', uid, 'progress', UNIT_ID);
  try {
    await setDoc(ref, {
      checked: ids,
      updatedAt: Date.now(),
      ts: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error('No se pudo guardar el progreso remoto:', err);
  }
}, 600);

async function bindProgressToUser(user) {
  if (!user || !window.__MAP__?.db) return;

  const version = ++bindVersion;
  currentUid = user.uid;

  if (unsubscribeRemote) {
    unsubscribeRemote();
    unsubscribeRemote = null;
  }

  const ref = doc(window.__MAP__.db, 'users', user.uid, 'progress', UNIT_ID);

  try {
    const snap = await getDoc(ref);

    // Si cambió el usuario mientras esperábamos Firestore, ignoramos esta respuesta vieja.
    if (version !== bindVersion || currentUid !== user.uid) return;

    const remoteIds = snap.exists() && Array.isArray(snap.data()?.checked)
      ? snap.data().checked
      : [];
    const localIds = loadLocal();

    if (localIds.length && !remoteIds.length) {
      applyCheckedToDOM(localIds);
      await setDoc(ref, {
        checked: localIds,
        updatedAt: Date.now(),
        ts: serverTimestamp()
      }, { merge: true });
    } else {
      applyCheckedToDOM(remoteIds);
      saveLocal(remoteIds);
    }

    if (version !== bindVersion || currentUid !== user.uid) return;

    unsubscribeRemote = onSnapshot(
      ref,
      (docSnap) => {
        if (currentUid !== user.uid) return;
        if (docSnap.exists()) {
          const server = Array.isArray(docSnap.data()?.checked)
            ? docSnap.data().checked
            : [];
          applyCheckedToDOM(server);
          saveLocal(server);
        }
      },
      (err) => console.error('No se pudo sincronizar el progreso remoto:', err)
    );
  } catch (err) {
    console.error('No se pudo vincular el progreso al usuario actual:', err);
  }
}

(async function initProgressSync() {
  $('input[type="checkbox"]').forEach((el, idx) => {
    if (!el.dataset.progressId) {
      const autoId = `${UNIT_ID}-chk-${String(idx + 1).padStart(2, '0')}`;
      el.setAttribute('data-progress-id', autoId);
    }
  });

  applyCheckedToDOM(loadLocal());

  // Los listeners de checkbox se instalan una sola vez.
  $('input[type="checkbox"][data-progress-id]').forEach(el => {
    el.addEventListener('change', () => {
      const ids = readCheckedFromDOM();
      saveLocal(ids);
      saveRemote(ids);
    });
  });

  // Espera a firebase-init y luego se rebindea cada vez que cambia el UID.
  const t0 = Date.now();
  const timer = setInterval(() => {
    if (window.__MAP__?.auth && window.__MAP__?.onAuthStateChanged) {
      clearInterval(timer);
      window.__MAP__.onAuthStateChanged(window.__MAP__.auth, (user) => {
        if (user) bindProgressToUser(user);
      });
    } else if (Date.now() - t0 > 10000) {
      clearInterval(timer);
      console.error('progress-sync: window.__MAP__ no está disponible.');
    }
  }, 100);
})();

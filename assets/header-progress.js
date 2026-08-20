import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const UNIT_PAGES = {
  unidad0: ['introduccion', 'bloque-a', 'bloque-b', 'bloque-c', 'bloque-d', 'bloque-e', 'mini-evaluacion'],
  unidad1: ['introduccion', 'bloque-a', 'bloque-b', 'bloque-c', 'bloque-d', 'bloque-e', 'bloque-f', 'bloque-g', 'mini-evaluacion'],
  unidad2: ['introduccion', 'bloque-a', 'bloque-b', 'bloque-c', 'bloque-d', 'bloque-e', 'mini-evaluacion'],
  unidad3: ['introduccion', 'bloque-a', 'bloque-b', 'bloque-c', 'bloque-d', 'bloque-e', 'mini-evaluacion'],
  unidad4: ['introduccion', 'bloque-a', 'bloque-b', 'bloque-c', 'bloque-d', 'bloque-e', 'bloque-f', 'mini-evaluacion']
};

const TOTAL_PAGES = Object.values(UNIT_PAGES).reduce((sum, pages) => sum + pages.length, 0);
const badge = document.getElementById('header-progress-badge');
const progressLink = document.getElementById('header-progress-link');

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch (_) {
    return fallback;
  }
}

function localCompleted(unitId) {
  const value = readJson(`map:completed:${unitId}`, []);
  return Array.isArray(value) ? value : [];
}

function localChecked(unitId) {
  const value = readJson(`progress:${unitId}`, []);
  return Array.isArray(value) ? value : [];
}

function legacyPages(unitId, checkedIds) {
  const sequence = UNIT_PAGES[unitId] || [];
  const ids = [...new Set((checkedIds || []).filter(Boolean))];
  const pages = [];
  const used = new Set();

  ids.forEach(id => {
    const match = String(id).match(/(?:chk-|c)(\d+)$/i);
    if (!match) return;

    const n = Number(match[1]);
    // En U0 la primera casilla histórica era la introducción.
    // En U1-U4 la primera casilla correspondía al Bloque A.
    const index = unitId === 'unidad0' ? n - 1 : n;
    if (index < 0 || index >= sequence.length) return;

    const pageId = sequence[index];
    if (!used.has(pageId)) {
      used.add(pageId);
      pages.push(pageId);
    }
  });

  // Compatibilidad con marcas antiguas sin numeración reconocible.
  if (pages.length < ids.length) {
    const start = unitId === 'unidad0' ? 0 : 1;
    for (let i = start; i < sequence.length && pages.length < ids.length; i += 1) {
      const pageId = sequence[i];
      if (!used.has(pageId)) {
        used.add(pageId);
        pages.push(pageId);
      }
    }
  }

  return pages;
}

function recognizedCount(unitId, completedPages) {
  const valid = new Set(UNIT_PAGES[unitId] || []);
  return [...new Set(completedPages || [])].filter(pageId => valid.has(pageId)).length;
}

function paint(done) {
  if (!badge) return;

  const safeDone = Math.max(0, Math.min(TOTAL_PAGES, Number(done) || 0));
  const pct = TOTAL_PAGES ? Math.round((safeDone / TOTAL_PAGES) * 100) : 0;

  badge.textContent = pct >= 100 ? '🏁 100%' : `${pct}%`;
  badge.title = `${safeDone}/${TOTAL_PAGES} páginas completadas`;
  badge.setAttribute('aria-label', `${safeDone} de ${TOTAL_PAGES} páginas completadas`);

  if (progressLink) {
    progressLink.setAttribute('aria-label', `Mi progreso: ${safeDone} de ${TOTAL_PAGES} páginas, ${pct}%`);
    progressLink.title = `Mi progreso · ${safeDone}/${TOTAL_PAGES} páginas`;
  }
}

function localTotal() {
  let done = 0;

  Object.keys(UNIT_PAGES).forEach(unitId => {
    const completed = new Set(localCompleted(unitId));
    legacyPages(unitId, localChecked(unitId)).forEach(pageId => completed.add(pageId));
    done += recognizedCount(unitId, [...completed]);
  });

  return done;
}

async function ensureMAP() {
  if (!window.__MAP__?.auth || !window.__MAP__?.db) {
    try {
      await import('/matematica-a-pedal/assets/firebase-init.js');
    } catch (_) {
      return null;
    }
  }

  const t0 = Date.now();
  while ((!window.__MAP__?.auth || !window.__MAP__?.db) && Date.now() - t0 < 10000) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return window.__MAP__?.auth && window.__MAP__?.db ? window.__MAP__ : null;
}

async function totalForUser(map, user) {
  if (!map?.db || !user?.uid) return localTotal();

  const counts = await Promise.all(Object.keys(UNIT_PAGES).map(async unitId => {
    const snap = await getDoc(doc(map.db, 'users', user.uid, 'progress', unitId));
    const data = snap.exists() ? snap.data() : {};
    const completed = new Set([
      ...(Array.isArray(data?.completedPages) ? data.completedPages : []),
      ...localCompleted(unitId)
    ]);

    // El badge es de solo lectura: interpreta el progreso histórico sin modificar Firestore.
    if ((Number(data?.progressModelVersion) || 0) < 2) {
      const checked = [
        ...(Array.isArray(data?.checked) ? data.checked : []),
        ...localChecked(unitId)
      ];
      legacyPages(unitId, checked).forEach(pageId => completed.add(pageId));
    }

    return recognizedCount(unitId, [...completed]);
  }));

  return counts.reduce((sum, count) => sum + count, 0);
}

let refreshVersion = 0;

async function refreshRemote(map, user) {
  const version = ++refreshVersion;
  try {
    const done = await totalForUser(map, user);
    if (version === refreshVersion) paint(done);
  } catch (err) {
    console.warn('No se pudo actualizar el progreso del encabezado:', err);
  }
}

// Respuesta inmediata con los datos locales, incluso sin conexión.
paint(localTotal());

(async function initHeaderProgress() {
  if (!badge) return;

  const map = await ensureMAP();
  if (!map) return;

  const initialUser = await map.authReady;
  if (initialUser) refreshRemote(map, initialUser);

  map.onAuthStateChanged(map.auth, user => {
    if (user) refreshRemote(map, user);
  });

  window.addEventListener('map:page-completed', () => {
    paint(localTotal());
    const user = map.auth.currentUser;
    if (user) refreshRemote(map, user);
  });

  window.addEventListener('map:progress-updated', () => {
    paint(localTotal());
    const user = map.auth.currentUser;
    if (user) refreshRemote(map, user);
  });

  window.addEventListener('storage', event => {
    if (!event.key || (!event.key.startsWith('map:completed:') && !event.key.startsWith('progress:'))) return;
    paint(localTotal());
    const user = map.auth.currentUser;
    if (user) refreshRemote(map, user);
  });
})();

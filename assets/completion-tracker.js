import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const BASE = '/matematica-a-pedal/';
const SCROLL_REQUIRED = 0.75;
const IDLE_LIMIT_MS = 120000;

const ROUTES = {
  unidad0: ['index.html', 'bloque-a.html', 'bloque-b.html', 'bloque-c.html', 'bloque-d.html', 'bloque-e.html', 'mini-evaluacion.html'],
  unidad1: ['index.html', 'bloque-a.html', 'bloque-b.html', 'bloque-c.html', 'bloque-d.html', 'bloque-e.html', 'bloque-f.html', 'bloque-g.html', 'mini-evaluacion.html'],
  unidad2: ['index.html', 'bloque-a.html', 'bloque-b.html', 'bloque-c.html', 'bloque-d.html', 'bloque-e.html', 'mini-evaluacion.html'],
  unidad3: ['index.html', 'bloque-a.html', 'bloque-b.html', 'bloque-c.html', 'bloque-d.html', 'bloque-e.html', 'mini-evaluacion.html'],
  unidad4: ['index.html', 'bloque-a.html', 'bloque-b.html', 'bloque-c.html', 'bloque-d.html', 'bloque-e.html', 'bloque-f.html', 'mini-evaluacion.html']
};

function routeInfo() {
  const match = location.pathname.match(/\/matematica-a-pedal\/(unidad[0-4])\/?([^/]*)$/);
  if (!match) return null;
  const unitId = match[1];
  const file = match[2] || 'index.html';
  if (!ROUTES[unitId]?.includes(file)) return null;
  return { unitId, file };
}

function pageIdFromFile(file) {
  if (file === 'index.html') return 'introduccion';
  if (file === 'mini-evaluacion.html') return 'mini-evaluacion';
  return file.replace(/\.html$/i, '');
}

function pageIdFromHref(href) {
  try {
    const url = new URL(href, location.origin);
    const file = url.pathname.split('/').filter(Boolean).pop() || 'index.html';
    return pageIdFromFile(file);
  } catch (_) {
    return null;
  }
}

function localCompletionKey(unitId) {
  return `map:completed:${unitId}`;
}

function localSessionKey(unitId, pageId) {
  return `map:page-session:${unitId}:${pageId}`;
}

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch (_) {
    return fallback;
  }
}

function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (_) {}
}

function readLocalCompleted(unitId) {
  const value = readJson(localCompletionKey(unitId), []);
  return Array.isArray(value) ? value : [];
}

function saveLocalCompleted(unitId, pages) {
  writeJson(localCompletionKey(unitId), [...new Set(pages)]);
}

async function ensureMAP() {
  if (!window.__MAP__?.auth || !window.__MAP__?.db) {
    try {
      await import(`${BASE}assets/firebase-init.js`);
    } catch (err) {
      console.error('completion-tracker: no se pudo cargar Firebase.', err);
    }
  }

  const t0 = Date.now();
  while ((!window.__MAP__?.auth || !window.__MAP__?.db) && Date.now() - t0 < 10000) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (!window.__MAP__?.auth || !window.__MAP__?.db) {
    throw new Error('Firebase no está disponible.');
  }

  const user = await window.__MAP__.authReady;
  return { map: window.__MAP__, user: user || window.__MAP__.auth.currentUser };
}

function contentWordCount() {
  const host = document.querySelector('main') || document.querySelector('body > section') || document.body;
  const text = (host?.innerText || '').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').filter(Boolean).length : 0;
}

function requiredSeconds(file) {
  const words = contentWordCount();
  const base = file === 'index.html' ? 30 : file === 'mini-evaluacion.html' ? 60 : 45;
  const cap = file === 'mini-evaluacion.html' ? 120 : 90;
  return Math.min(cap, Math.max(base, Math.round(words / 12)));
}

function scrollProgress() {
  const doc = document.documentElement;
  const height = Math.max(doc.scrollHeight, document.body?.scrollHeight || 0);
  if (height <= innerHeight + 40) return 1;
  return Math.max(0, Math.min(1, (scrollY + innerHeight) / height));
}

async function waitForNavigator() {
  const t0 = Date.now();
  while (Date.now() - t0 < 10000) {
    const nav = document.querySelector('.map-unit-nav');
    if (nav && nav.querySelector('a[href]')) return nav;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return null;
}

function statusBox(nav) {
  let box = document.getElementById('map-completion-status');
  if (box) return box;

  box = document.createElement('div');
  box.id = 'map-completion-status';
  box.style.cssText = [
    'max-width:1180px',
    'margin:10px auto 0',
    'box-sizing:border-box',
    'padding:9px 12px',
    'border:1px solid #FFD580',
    'border-radius:10px',
    'background:#fff',
    'color:#7f6000',
    'font-family:"Roboto Mono", monospace',
    'font-size:13px',
    'text-align:center'
  ].join(';');
  nav.parentNode?.insertBefore(box, nav);
  return box;
}

function setForwardDisabled(a, disabled) {
  if (!a) return;
  a.setAttribute('aria-disabled', String(disabled));
  a.style.opacity = disabled ? '0.62' : '1';
  a.style.cursor = disabled ? 'not-allowed' : 'pointer';
}

function applyAutomaticChecklist(unitId, completedPages) {
  const indexMatch = location.pathname.match(/\/(unidad[0-4])\/?(?:index\.html)?$/);
  if (!indexMatch || indexMatch[1] !== unitId) return;

  const completed = new Set(completedPages);
  const sequence = ROUTES[unitId];

  document.querySelectorAll('input[data-key^="c"]').forEach(input => {
    const n = Number(String(input.dataset.key || '').replace(/^c/i, ''));
    if (!Number.isFinite(n) || n < 1 || n >= sequence.length) return;

    const targetPageId = pageIdFromFile(sequence[n]);
    const done = completed.has(targetPageId);
    const label = input.closest('label');
    const card = input.closest('[data-key]');
    const pill = card?.querySelector('[class*="pill"]');

    input.checked = done;
    input.disabled = true;
    input.style.display = 'none';

    if (label) {
      label.style.cursor = 'default';
      const span = label.querySelector('span');
      if (span) span.textContent = done ? '✅ Completado automáticamente' : '⏳ Se completa al finalizar el bloque';
    }

    if (pill) pill.textContent = done ? '✅ Completado' : '⏳ Pendiente';
  });
}

async function readProgressDoc(db, uid, unitId) {
  const ref = doc(db, 'users', uid, 'progress', unitId);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};
  const remotePages = Array.isArray(data?.completedPages) ? data.completedPages : [];
  const localPages = readLocalCompleted(unitId);
  const completedPages = [...new Set([...remotePages, ...localPages])];

  if (completedPages.length > remotePages.length) {
    await setDoc(ref, {
      completedPages,
      progressModelVersion: 2,
      updatedAt: Date.now(),
      ts: serverTimestamp()
    }, { merge: true });
  }

  saveLocalCompleted(unitId, completedPages);
  return { ref, data, completedPages };
}

async function markCompleted(db, uid, unitId, pageId, activeSeconds, maxScroll) {
  const ref = doc(db, 'users', uid, 'progress', unitId);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};
  const remotePages = Array.isArray(data?.completedPages) ? data.completedPages : [];
  const localPages = readLocalCompleted(unitId);
  const completedPages = [...new Set([...remotePages, ...localPages, pageId])];
  const existingMeta = data?.completionMeta && typeof data.completionMeta === 'object'
    ? data.completionMeta
    : {};
  const previous = existingMeta[pageId] && typeof existingMeta[pageId] === 'object'
    ? existingMeta[pageId]
    : {};

  const completionMeta = {
    ...existingMeta,
    [pageId]: {
      ...previous,
      activeSeconds: Math.max(Number(previous.activeSeconds) || 0, Math.round(activeSeconds)),
      maxScroll: Math.max(Number(previous.maxScroll) || 0, Math.round(maxScroll * 100) / 100),
      completedAt: Number(previous.completedAt) || Date.now()
    }
  };

  saveLocalCompleted(unitId, completedPages);

  await setDoc(ref, {
    completedPages,
    completionMeta,
    progressModelVersion: 2,
    updatedAt: Date.now(),
    ts: serverTimestamp()
  }, { merge: true });

  window.dispatchEvent(new CustomEvent('map:page-completed', {
    detail: { unitId, pageId }
  }));
}

(async function initCompletionTracker() {
  const route = routeInfo();
  if (!route) return;

  if (document.readyState === 'loading') {
    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  }

  const nav = await waitForNavigator();
  if (!nav) return;

  const forward = Array.from(nav.querySelectorAll('a[href]')).at(-1);
  if (!forward) return;

  const originalHref = forward.getAttribute('href');
  const originalText = forward.textContent;
  const pageId = pageIdFromFile(route.file);
  const minSeconds = requiredSeconds(route.file);
  const box = statusBox(nav);

  const savedSession = readJson(localSessionKey(route.unitId, pageId), {});
  let activeSeconds = Math.max(0, Number(savedSession?.activeSeconds) || 0);
  let maxScroll = Math.max(scrollProgress(), Number(savedSession?.maxScroll) || 0);
  let lastActivityAt = Date.now();
  let completed = false;
  let busy = false;

  const touchActivity = () => { lastActivityAt = Date.now(); };
  ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach(eventName => {
    window.addEventListener(eventName, touchActivity, { passive: true });
  });

  const persistSession = () => {
    writeJson(localSessionKey(route.unitId, pageId), { activeSeconds, maxScroll });
  };

  function ready() {
    return activeSeconds >= minSeconds && maxScroll >= SCROLL_REQUIRED;
  }

  function paint() {
    maxScroll = Math.max(maxScroll, scrollProgress());
    const remaining = Math.max(0, minSeconds - Math.floor(activeSeconds));
    const scrollPct = Math.round(maxScroll * 100);

    if (completed) {
      box.textContent = '✅ Página completada. Podés repasarla y avanzar sin restricciones.';
      forward.textContent = originalText;
      setForwardDisabled(forward, false);
      return;
    }

    if (ready()) {
      box.textContent = `✅ Requisitos alcanzados: ${Math.floor(activeSeconds)} s activos · recorrido ${scrollPct}%.`;
      forward.textContent = '✓ Completar y continuar ➡️';
      setForwardDisabled(forward, false);
      return;
    }

    const timeText = remaining > 0 ? `⏱ ${Math.floor(activeSeconds)}/${minSeconds} s activos` : '⏱ Tiempo mínimo alcanzado';
    const scrollText = maxScroll >= SCROLL_REQUIRED ? '📖 Recorrido suficiente' : `📖 Recorrido ${scrollPct}%/75%`;
    box.textContent = `Para completar esta página: ${timeText} · ${scrollText}`;

    if (remaining > 0) {
      forward.textContent = `Disponible en ${remaining} s`;
    } else {
      forward.textContent = 'Recorré un poco más la página';
    }
    setForwardDisabled(forward, true);
  }

  try {
    const { map, user } = await ensureMAP();
    if (!user) throw new Error('No hay una sesión activa.');

    const state = await readProgressDoc(map.db, user.uid, route.unitId);
    completed = state.completedPages.includes(pageId);
    applyAutomaticChecklist(route.unitId, state.completedPages);
    paint();

    map.onAuthStateChanged(map.auth, async nextUser => {
      if (!nextUser || nextUser.uid === user.uid) return;
      try {
        const nextState = await readProgressDoc(map.db, nextUser.uid, route.unitId);
        completed = nextState.completedPages.includes(pageId);
        applyAutomaticChecklist(route.unitId, nextState.completedPages);
        paint();
      } catch (err) {
        console.warn('completion-tracker: no se pudo actualizar el estado tras cambiar de usuario.', err);
      }
    });

    const timer = setInterval(() => {
      maxScroll = Math.max(maxScroll, scrollProgress());

      if (!completed && document.visibilityState === 'visible' && document.hasFocus() && Date.now() - lastActivityAt < IDLE_LIMIT_MS) {
        activeSeconds += 1;
      }

      if (Math.floor(activeSeconds) % 5 === 0) persistSession();
      paint();
    }, 1000);

    window.addEventListener('beforeunload', () => {
      persistSession();
      clearInterval(timer);
    });

    forward.addEventListener('click', async event => {
      if (completed) return;

      if (!ready() || busy) {
        event.preventDefault();
        paint();
        return;
      }

      event.preventDefault();
      busy = true;
      forward.textContent = 'Guardando progreso…';
      setForwardDisabled(forward, true);

      const currentUser = map.auth.currentUser || user;
      try {
        await markCompleted(map.db, currentUser.uid, route.unitId, pageId, activeSeconds, maxScroll);
        completed = true;
        localStorage.removeItem(localSessionKey(route.unitId, pageId));
        applyAutomaticChecklist(route.unitId, [...readLocalCompleted(route.unitId), pageId]);
        location.href = originalHref;
      } catch (err) {
        console.error('completion-tracker: no se pudo guardar la finalización.', err);
        saveLocalCompleted(route.unitId, [...readLocalCompleted(route.unitId), pageId]);
        box.textContent = '⚠️ Se guardó el avance en este navegador, pero no se pudo sincronizar con la nube. Se reintentará más adelante.';
        setTimeout(() => { location.href = originalHref; }, 900);
      }
    }, true);
  } catch (err) {
    console.error('completion-tracker:', err);
    box.textContent = '⚠️ No se pudo activar el registro automático de progreso. La navegación sigue disponible desde el menú superior.';
    forward.textContent = originalText;
    setForwardDisabled(forward, false);
  }
})();

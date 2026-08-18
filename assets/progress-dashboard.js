import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const UNITS = [
  {
    id: 'unidad0',
    title: 'Unidad 0 · Calentamiento Matemático',
    items: [
      ['Introducción', '/matematica-a-pedal/unidad0/index.html'],
      ['Bloque A', '/matematica-a-pedal/unidad0/bloque-a.html'],
      ['Bloque B', '/matematica-a-pedal/unidad0/bloque-b.html'],
      ['Bloque C', '/matematica-a-pedal/unidad0/bloque-c.html'],
      ['Bloque D', '/matematica-a-pedal/unidad0/bloque-d.html'],
      ['Bloque E', '/matematica-a-pedal/unidad0/bloque-e.html'],
      ['Mini-evaluación', '/matematica-a-pedal/unidad0/mini-evaluacion.html']
    ]
  },
  {
    id: 'unidad1',
    title: 'Unidad 1 · Conjuntos y Operaciones',
    items: [
      ['Bloque A', '/matematica-a-pedal/unidad1/bloque-a.html'],
      ['Bloque B', '/matematica-a-pedal/unidad1/bloque-b.html'],
      ['Bloque C', '/matematica-a-pedal/unidad1/bloque-c.html'],
      ['Bloque D', '/matematica-a-pedal/unidad1/bloque-d.html'],
      ['Bloque E', '/matematica-a-pedal/unidad1/bloque-e.html'],
      ['Bloque F', '/matematica-a-pedal/unidad1/bloque-f.html'],
      ['Bloque G', '/matematica-a-pedal/unidad1/bloque-g.html'],
      ['Mini-evaluación', '/matematica-a-pedal/unidad1/mini-evaluacion.html']
    ]
  },
  {
    id: 'unidad2',
    title: 'Unidad 2 · Factorización y Expresiones',
    items: [
      ['Bloque A', '/matematica-a-pedal/unidad2/bloque-a.html'],
      ['Bloque B', '/matematica-a-pedal/unidad2/bloque-b.html'],
      ['Bloque C', '/matematica-a-pedal/unidad2/bloque-c.html'],
      ['Bloque D', '/matematica-a-pedal/unidad2/bloque-d.html'],
      ['Bloque E', '/matematica-a-pedal/unidad2/bloque-e.html'],
      ['Mini-evaluación', '/matematica-a-pedal/unidad2/mini-evaluacion.html']
    ]
  },
  {
    id: 'unidad3',
    title: 'Unidad 3 · Trigonometría',
    items: [
      ['Bloque A', '/matematica-a-pedal/unidad3/bloque-a.html'],
      ['Bloque B', '/matematica-a-pedal/unidad3/bloque-b.html'],
      ['Bloque C', '/matematica-a-pedal/unidad3/bloque-c.html'],
      ['Bloque D', '/matematica-a-pedal/unidad3/bloque-d.html'],
      ['Bloque E', '/matematica-a-pedal/unidad3/bloque-e.html'],
      ['Mini-evaluación', '/matematica-a-pedal/unidad3/mini-evaluacion.html']
    ]
  },
  {
    id: 'unidad4',
    title: 'Unidad 4 · Potenciación, Radicación y Notación Científica',
    items: [
      ['Bloque A', '/matematica-a-pedal/unidad4/bloque-a.html'],
      ['Bloque B', '/matematica-a-pedal/unidad4/bloque-b.html'],
      ['Bloque C', '/matematica-a-pedal/unidad4/bloque-c.html'],
      ['Bloque D', '/matematica-a-pedal/unidad4/bloque-d.html'],
      ['Bloque E', '/matematica-a-pedal/unidad4/bloque-e.html'],
      ['Bloque F', '/matematica-a-pedal/unidad4/bloque-f.html']
    ]
  }
];

const $ = id => document.getElementById(id);

function waitForMAP() {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const timer = setInterval(() => {
      if (window.__MAP__?.auth && window.__MAP__?.db) {
        clearInterval(timer);
        resolve(window.__MAP__);
      } else if (Date.now() - t0 > 10000) {
        clearInterval(timer);
        reject(new Error('No se pudo inicializar Firebase.'));
      }
    }, 100);
  });
}

function localChecked(unitId) {
  try {
    const value = JSON.parse(localStorage.getItem(`progress:${unitId}`) || '[]');
    return Array.isArray(value) ? value : [];
  } catch (_) {
    return [];
  }
}

function recognizedIndex(unitId, progressId) {
  if (typeof progressId !== 'string') return -1;

  const auto = progressId.match(new RegExp(`^${unitId}-chk-(\\d+)$`));
  if (auto) return Number(auto[1]) - 1;

  const card = progressId.match(new RegExp(`^${unitId}-c(\\d+)$`));
  if (card) return Number(card[1]) - 1;

  return -1;
}

function normalizeChecked(unit, ids) {
  const total = unit.items.length;
  const unique = [...new Set((ids || []).filter(Boolean))];
  const recognized = new Set();

  unique.forEach(id => {
    const idx = recognizedIndex(unit.id, id);
    if (idx >= 0 && idx < total) recognized.add(idx);
  });

  // Compatibilidad: si encontramos datos antiguos pero no IDs reconocibles,
  // conservamos al menos la cantidad registrada para mostrar una estimación prudente.
  if (!recognized.size && unique.length) {
    for (let i = 0; i < Math.min(unique.length, total); i += 1) recognized.add(i);
  }

  return recognized;
}

async function readUnitProgress(db, uid, unit) {
  const remoteRef = doc(db, 'users', uid, 'progress', unit.id);
  const snap = await getDoc(remoteRef);
  const remote = snap.exists() && Array.isArray(snap.data()?.checked)
    ? snap.data().checked
    : [];
  const local = localChecked(unit.id);
  return normalizeChecked(unit, [...remote, ...local]);
}

function unitState(done, total) {
  if (done === 0) return { icon: '⚪', text: 'Sin comenzar' };
  if (done >= total) return { icon: '✅', text: 'Completada' };
  return { icon: '🟡', text: 'En curso' };
}

function renderUnit(unit, checked) {
  const total = unit.items.length;
  const done = checked.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const state = unitState(done, total);

  const card = document.createElement('article');
  card.style.cssText = 'border:1px solid #FFD580;border-radius:12px;padding:14px;background:#fff;';

  const top = document.createElement('div');
  top.style.cssText = 'display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;';

  const title = document.createElement('div');
  title.innerHTML = `<strong style="color:#783f04;">${state.icon} ${unit.title}</strong><div style="margin-top:4px;">${done}/${total} completados · ${pct}%</div>`;

  const badge = document.createElement('span');
  badge.textContent = state.text;
  badge.style.cssText = 'border:1px solid #FFD580;border-radius:999px;padding:3px 9px;font-size:12px;background:#FFF6E6;white-space:nowrap;';

  top.append(title, badge);
  card.appendChild(top);

  const barWrap = document.createElement('div');
  barWrap.style.cssText = 'height:10px;margin-top:10px;background:#FFF6E6;border:1px solid #FFD580;border-radius:999px;overflow:hidden;';
  const bar = document.createElement('div');
  bar.style.cssText = `height:100%;width:${pct}%;background:#FFA559;`;
  barWrap.appendChild(bar);
  card.appendChild(barWrap);

  const missingIndex = unit.items.findIndex((_, idx) => !checked.has(idx));
  const targetIndex = missingIndex >= 0 ? missingIndex : total - 1;
  const [targetLabel, targetHref] = unit.items[targetIndex];

  const action = document.createElement('div');
  action.style.cssText = 'margin-top:10px;display:flex;justify-content:flex-end;';
  const link = document.createElement('a');
  link.href = targetHref;
  link.textContent = done >= total ? 'Revisar unidad' : `Continuar en ${targetLabel} ➡️`;
  link.style.cssText = 'text-decoration:none;color:#783f04;background:#fff;border:1px solid #FFD580;border-radius:10px;padding:7px 11px;';
  action.appendChild(link);
  card.appendChild(action);

  return { card, done, total, nextHref: done < total ? targetHref : null };
}

function setIdentity(user) {
  const status = $('progress-user-status');
  const loginBtn = $('progress-login-btn');
  if (!status || !loginBtn) return;

  if (user?.email && window.__MAP__?.isAllowedEmail?.(user.email)) {
    status.textContent = `Sesión UTEC activa: ${user.email}. Tu progreso queda asociado a esta cuenta.`;
    loginBtn.style.display = 'none';
  } else {
    status.textContent = 'Estás usando una sesión anónima. Podés avanzar normalmente; iniciar sesión con UTEC permite mantener el progreso asociado a tu cuenta.';
    loginBtn.style.display = 'inline-block';
  }
}

function showError(message) {
  const box = $('progress-error');
  if (!box) return;
  box.style.display = 'block';
  box.textContent = message;
}

async function renderDashboard(user) {
  if (!user || !window.__MAP__?.db) return;

  setIdentity(user);
  const container = $('progress-units');
  if (!container) return;
  container.innerHTML = '<div style="padding:12px;">Cargando tu recorrido…</div>';

  try {
    const checkedSets = await Promise.all(
      UNITS.map(unit => readUnitProgress(window.__MAP__.db, user.uid, unit))
    );

    container.innerHTML = '';
    let doneAll = 0;
    let totalAll = 0;
    let overallNext = null;

    UNITS.forEach((unit, i) => {
      const rendered = renderUnit(unit, checkedSets[i]);
      container.appendChild(rendered.card);
      doneAll += rendered.done;
      totalAll += rendered.total;
      if (!overallNext && rendered.nextHref) overallNext = rendered.nextHref;
    });

    const pct = totalAll ? Math.round((doneAll / totalAll) * 100) : 0;
    $('progress-general-label').textContent = `${doneAll} de ${totalAll} etapas completadas`;
    $('progress-general-percent').textContent = `${pct}%`;
    $('progress-general-bar').style.width = `${pct}%`;

    const continueA = $('progress-continue');
    if (overallNext) {
      continueA.href = overallNext;
      continueA.textContent = '▶️ Continuar donde quedé';
    } else {
      continueA.href = '/matematica-a-pedal/';
      continueA.textContent = '🏁 Recorrido completado';
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = '';
    showError('No se pudo leer el progreso en este momento. Probá recargar la página.');
  }
}

(async function init() {
  try {
    const map = await waitForMAP();
    const initialUser = await map.authReady;
    if (initialUser) await renderDashboard(initialUser);

    map.onAuthStateChanged(map.auth, user => {
      if (user) renderDashboard(user);
    });

    $('progress-login-btn')?.addEventListener('click', async () => {
      try {
        await map.signInWithUtec();
      } catch (err) {
        console.error(err);
        showError(err?.message || 'No se pudo iniciar sesión.');
      }
    });
  } catch (err) {
    console.error(err);
    showError(err?.message || 'No se pudo cargar Mi progreso.');
  }
})();

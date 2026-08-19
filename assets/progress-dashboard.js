import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
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
      ['Introducción', '/matematica-a-pedal/unidad1/index.html'],
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
      ['Introducción', '/matematica-a-pedal/unidad2/index.html'],
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
      ['Introducción', '/matematica-a-pedal/unidad3/index.html'],
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
      ['Introducción', '/matematica-a-pedal/unidad4/index.html'],
      ['Bloque A', '/matematica-a-pedal/unidad4/bloque-a.html'],
      ['Bloque B', '/matematica-a-pedal/unidad4/bloque-b.html'],
      ['Bloque C', '/matematica-a-pedal/unidad4/bloque-c.html'],
      ['Bloque D', '/matematica-a-pedal/unidad4/bloque-d.html'],
      ['Bloque E', '/matematica-a-pedal/unidad4/bloque-e.html'],
      ['Bloque F', '/matematica-a-pedal/unidad4/bloque-f.html'],
      ['Mini-evaluación', '/matematica-a-pedal/unidad4/mini-evaluacion.html']
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

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch (_) {
    return fallback;
  }
}

function localChecked(unitId) {
  const value = readJson(`progress:${unitId}`, []);
  return Array.isArray(value) ? value : [];
}

function localCompleted(unitId) {
  const value = readJson(`map:completed:${unitId}`, []);
  return Array.isArray(value) ? value : [];
}

function saveLocalCompleted(unitId, pages) {
  try {
    localStorage.setItem(`map:completed:${unitId}`, JSON.stringify([...new Set(pages)]));
  } catch (_) {}
}

function pageIdFromHref(href) {
  const file = new URL(href, location.origin).pathname.split('/').filter(Boolean).pop() || 'index.html';
  if (file === 'index.html') return 'introduccion';
  if (file === 'mini-evaluacion.html') return 'mini-evaluacion';
  return file.replace(/\.html$/i, '');
}

function legacyPages(unit, checkedIds) {
  const ids = [...new Set((checkedIds || []).filter(Boolean))];
  const pages = [];
  const used = new Set();

  ids.forEach(id => {
    const match = String(id).match(/(?:chk-|c)(\d+)$/i);
    if (!match) return;

    const n = Number(match[1]);
    // La portada histórica de U0 sí incluía la introducción como primera casilla.
    // En U1-U4, la primera casilla correspondía al Bloque A.
    const itemIndex = unit.id === 'unidad0' ? n - 1 : n;
    if (itemIndex < 0 || itemIndex >= unit.items.length) return;

    const pageId = pageIdFromHref(unit.items[itemIndex][1]);
    if (!used.has(pageId)) {
      used.add(pageId);
      pages.push(pageId);
    }
  });

  // Si un formato histórico no tenía numeración reconocible, preservamos solamente
  // la cantidad registrada y respetamos si esa unidad incluía o no la introducción.
  if (pages.length < ids.length) {
    const start = unit.id === 'unidad0' ? 0 : 1;
    for (let i = start; i < unit.items.length && pages.length < ids.length; i += 1) {
      const pageId = pageIdFromHref(unit.items[i][1]);
      if (!used.has(pageId)) {
        used.add(pageId);
        pages.push(pageId);
      }
    }
  }

  return pages;
}

function unitCompletionDate(unit, data, completedPages) {
  const completed = new Set(completedPages);
  if (!unit.items.every(item => completed.has(pageIdFromHref(item[1])))) return null;

  const meta = data?.completionMeta && typeof data.completionMeta === 'object'
    ? data.completionMeta
    : {};

  const dates = unit.items.map(item => {
    const pageId = pageIdFromHref(item[1]);
    return Number(meta?.[pageId]?.completedAt) || 0;
  });

  // En progresos históricos migrados puede no existir una fecha verificable.
  if (dates.some(value => value <= 0)) return null;
  return Math.max(...dates);
}

async function readUnitProgress(db, uid, unit) {
  const ref = doc(db, 'users', uid, 'progress', unit.id);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};
  const remotePages = Array.isArray(data?.completedPages) ? data.completedPages : [];
  const localPages = localCompleted(unit.id);
  let completedPages = [...new Set([...remotePages, ...localPages])];

  // Migración única del esquema manual anterior. Una vez fijada la versión 2,
  // marcar viejas casillas ya no puede aumentar el progreso del recorrido.
  if ((Number(data?.progressModelVersion) || 0) < 2) {
    const oldChecked = [
      ...(Array.isArray(data?.checked) ? data.checked : []),
      ...localChecked(unit.id)
    ];
    completedPages = [...new Set([...completedPages, ...legacyPages(unit, oldChecked)])];
  }

  const needsSync = completedPages.length !== remotePages.length || (Number(data?.progressModelVersion) || 0) < 2;
  if (needsSync) {
    await setDoc(ref, {
      completedPages,
      progressModelVersion: 2,
      updatedAt: Date.now(),
      ts: serverTimestamp()
    }, { merge: true });
  }

  saveLocalCompleted(unit.id, completedPages);

  const completedIds = new Set(completedPages);
  const checked = new Set();
  unit.items.forEach((item, idx) => {
    if (completedIds.has(pageIdFromHref(item[1]))) checked.add(idx);
  });

  return {
    checked,
    completionDate: unitCompletionDate(unit, data, completedPages)
  };
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
  title.innerHTML = `<strong style="color:#783f04;">${state.icon} ${unit.title}</strong><div style="margin-top:4px;">${done}/${total} páginas completadas · ${pct}%</div>`;

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

function formatCompletionDate(timestamp) {
  if (!timestamp) return '';
  try {
    return new Intl.DateTimeFormat('es-UY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(timestamp));
  } catch (_) {
    return '';
  }
}

function setJourneyCompletionMode(isComplete, doneAll, totalAll, completionDate) {
  const heroTitle = $('progress-hero-title');
  const heroText = $('progress-hero-text');
  const criteria = $('progress-criteria');
  const generalTitle = $('progress-general-title');
  const actions = $('progress-complete-actions');
  const achievement = $('progress-achievement');
  const achievementCount = $('progress-achievement-count');
  const achievementDate = $('progress-achievement-date');
  const achievementToggle = $('progress-achievement-toggle');
  const continueWrap = $('progress-continue-wrap');

  if (isComplete) {
    if (heroTitle) heroTitle.textContent = '🏁 ¡Recorrido completado!';
    if (heroText) heroText.textContent = `Completaste las ${totalAll} páginas de Matemática a Pedal. Podés revisar cualquier unidad cuando quieras.`;
    if (criteria) criteria.style.display = 'none';
    if (generalTitle) generalTitle.textContent = 'Tu recorrido está completo';
    if (actions) actions.style.display = 'flex';
    if (continueWrap) continueWrap.style.display = 'none';
    if (achievementCount) achievementCount.textContent = `${doneAll} / ${totalAll} páginas`;

    const dateText = formatCompletionDate(completionDate);
    if (achievementDate) {
      achievementDate.textContent = dateText ? `Finalizado: ${dateText}` : '';
      achievementDate.style.display = dateText ? 'block' : 'none';
    }
  } else {
    if (heroTitle) heroTitle.textContent = '🚲 Mi progreso';
    if (heroText) heroText.textContent = 'Acá podés ver cuánto avanzaste en Matemática a Pedal y retomar el recorrido desde el siguiente punto pendiente.';
    if (criteria) criteria.style.display = '';
    if (generalTitle) generalTitle.textContent = 'Tu recorrido';
    if (actions) actions.style.display = 'none';
    if (continueWrap) continueWrap.style.display = 'flex';
    if (achievement) achievement.hidden = true;
    if (achievementToggle) achievementToggle.textContent = '🎓 Ver mi logro';
  }
}

function setupAchievementToggle() {
  const button = $('progress-achievement-toggle');
  const achievement = $('progress-achievement');
  if (!button || !achievement || button.dataset.bound === '1') return;

  button.dataset.bound = '1';
  button.addEventListener('click', () => {
    achievement.hidden = !achievement.hidden;
    button.textContent = achievement.hidden ? '🎓 Ver mi logro' : 'Ocultar mi logro';

    if (!achievement.hidden) {
      achievement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
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
    const unitProgress = await Promise.all(
      UNITS.map(unit => readUnitProgress(window.__MAP__.db, user.uid, unit))
    );

    container.innerHTML = '';
    let doneAll = 0;
    let totalAll = 0;
    let overallNext = null;
    const completionDates = [];

    UNITS.forEach((unit, i) => {
      const rendered = renderUnit(unit, unitProgress[i].checked);
      container.appendChild(rendered.card);
      doneAll += rendered.done;
      totalAll += rendered.total;
      if (!overallNext && rendered.nextHref) overallNext = rendered.nextHref;
      if (unitProgress[i].completionDate) completionDates.push(unitProgress[i].completionDate);
    });

    const pct = totalAll ? Math.round((doneAll / totalAll) * 100) : 0;
    $('progress-general-label').textContent = `${doneAll} de ${totalAll} páginas completadas`;
    $('progress-general-percent').textContent = `${pct}%`;
    $('progress-general-bar').style.width = `${pct}%`;

    const isComplete = totalAll > 0 && doneAll >= totalAll;
    const completionDate = isComplete && completionDates.length === UNITS.length
      ? Math.max(...completionDates)
      : null;
    setJourneyCompletionMode(isComplete, doneAll, totalAll, completionDate);

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
    setupAchievementToggle();

    const map = await waitForMAP();
    const initialUser = await map.authReady;
    if (initialUser) await renderDashboard(initialUser);

    map.onAuthStateChanged(map.auth, user => {
      if (user) renderDashboard(user);
    });

    window.addEventListener('map:page-completed', () => {
      const user = map.auth.currentUser;
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
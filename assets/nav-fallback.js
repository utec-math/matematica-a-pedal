const BASE = '/matematica-a-pedal/';

const stages = [
  {
    key: 'unidad0',
    center: 'Calentamiento',
    pages: [
      ['index.html', 'Punto de partida'],
      ['bloque-a.html', 'Chequeo A · Conjuntos numéricos'],
      ['bloque-b.html', 'Chequeo B · Propiedades de las operaciones'],
      ['bloque-c.html', 'Chequeo C · Fracciones'],
      ['bloque-d.html', 'Chequeo D · Potencias y raíces'],
      ['bloque-e.html', 'Chequeo E · Notación científica'],
      ['mini-evaluacion.html', 'Chequeo final']
    ]
  },
  {
    key: 'unidad1',
    center: 'Etapa 1',
    pages: [
      ['index.html', 'Inicio · Números y operaciones'],
      ['bloque-a.html', 'Paso 1 · Conjuntos numéricos'],
      ['bloque-b.html', 'Paso 2 · Propiedades para calcular mejor'],
      ['bloque-c.html', 'Paso 3 · Suma y resta con signos'],
      ['bloque-d.html', 'Paso 4 · Multiplicación y división'],
      ['bloque-e.html', 'Paso 5 · Fracciones equivalentes'],
      ['bloque-f.html', 'Paso 6 · Operaciones con fracciones'],
      ['bloque-g.html', 'Paso 7 · Decimales y fracciones'],
      ['mini-evaluacion.html', 'Parada de control · Etapa 1']
    ]
  },
  {
    key: 'unidad2',
    center: 'Etapa 2',
    pages: [
      ['index.html', 'Inicio · Álgebra en acción'],
      ['bloque-a.html', 'Paso 1 · Expresiones y polinomios'],
      ['bloque-b.html', 'Paso 2 · Operar expresiones'],
      ['bloque-c.html', 'Paso 3 · Productos notables'],
      ['bloque-d.html', 'Paso 4 · Factorizar para simplificar'],
      ['bloque-e.html', 'Paso 5 · Fracciones algebraicas'],
      ['mini-evaluacion.html', 'Parada de control · Etapa 2']
    ]
  },
  {
    key: 'unidad3',
    center: 'Etapa 3',
    pages: [
      ['index.html', 'Inicio · Trigonometría'],
      ['bloque-a.html', 'Paso 1 · Origen y aplicaciones'],
      ['bloque-b.html', 'Paso 2 · Medir ángulos'],
      ['bloque-c.html', 'Paso 3 · Relaciones entre ángulos'],
      ['bloque-d.html', 'Paso 4 · Razones trigonométricas'],
      ['bloque-e.html', 'Paso 5 · Círculo unitario'],
      ['mini-evaluacion.html', 'Parada de control · Etapa 3']
    ]
  },
  {
    key: 'unidad4',
    center: 'Etapa 4',
    pages: [
      ['index.html', 'Inicio · Potencias y raíces'],
      ['bloque-a.html', 'Paso 1 · Potencias y exponentes'],
      ['bloque-b.html', 'Paso 2 · Raíces y exponentes fraccionarios'],
      ['bloque-c.html', 'Paso 3 · Simplificar radicales'],
      ['bloque-d.html', 'Paso 4 · Notación científica'],
      ['bloque-e.html', 'Paso 5 · Laboratorio interactivo'],
      ['bloque-f.html', 'Paso 6 · Práctica final'],
      ['mini-evaluacion.html', 'Parada de control · Etapa 4']
    ]
  }
];

const routes = [];
stages.forEach(stage => {
  stage.pages.forEach(([file, nav], index) => {
    routes.push({
      path: `${BASE}${stage.key}/${file}`,
      nav,
      center: stage.center,
      index,
      total: stage.pages.length
    });
  });
});

function normalizePath(pathname) {
  if (pathname.endsWith('/')) return `${pathname}index.html`;
  return pathname;
}

function structuralNavigator() {
  const ready = document.querySelector('.map-unit-nav,[data-map-route-nav="true"]');
  if (ready) return ready;

  const candidates = Array.from(document.querySelectorAll('div, section')).filter(el => {
    if (el.closest('#header-placeholder')) return false;
    const direct = Array.from(el.children).filter(ch => ch.tagName === 'A');
    if (!direct.length || direct.length > 2) return false;
    return direct.every(a => /\/matematica-a-pedal\/(?:unidad[0-4]\/|progreso\.html|index\.html)/.test(a.getAttribute('href') || ''));
  });

  return candidates[candidates.length - 1] || null;
}

function makeButton(href, text, side) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  a.style.cssText = [
    'text-decoration:none','color:#783f04','background:#fff','border:1px solid #FFD580',
    'border-radius:10px','padding:9px 14px','display:inline-block','max-width:100%',
    'box-sizing:border-box', side === 'left' ? 'justify-self:start' : 'justify-self:end'
  ].join(';');
  return a;
}

function ensureNavigator() {
  const path = normalizePath(window.location.pathname);
  const currentIndex = routes.findIndex(route => route.path === path);
  if (currentIndex < 0) return;

  let nav = structuralNavigator();
  if (nav?.dataset?.mapRouteNav === 'true' || nav?.classList?.contains('map-unit-nav')) return;

  const current = routes[currentIndex];
  const previous = currentIndex > 0 ? routes[currentIndex - 1] : null;
  const next = currentIndex < routes.length - 1 ? routes[currentIndex + 1] : null;

  if (!nav) {
    nav = document.createElement('div');
    const host = document.querySelector('main') || document.querySelector('body > section') || document.body;
    host.appendChild(nav);
  }

  nav.dataset.mapRouteNav = 'true';
  nav.classList.add('map-unit-nav');
  nav.innerHTML = '';
  nav.style.cssText = "display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:10px;margin:18px auto 12px;max-width:1180px;box-sizing:border-box;background:#FFF6E6;border:1px solid #FFD580;border-radius:12px;padding:12px;font-family:'Roboto Mono',monospace;";

  if (previous) nav.appendChild(makeButton(previous.path, `⬅️ ${previous.nav}`, 'left'));
  else nav.appendChild(document.createElement('span'));

  const center = document.createElement('span');
  center.textContent = `${current.center} · ${current.index + 1}/${current.total}`;
  center.style.cssText = 'color:#7f6000;font-size:13px;text-align:center;white-space:nowrap;';
  nav.appendChild(center);

  if (next) nav.appendChild(makeButton(next.path, `${next.nav} ➡️`, 'right'));
  else nav.appendChild(makeButton(`${BASE}progreso.html`, '🏁 Ver mi progreso', 'right'));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ensureNavigator, { once: true });
} else {
  ensureNavigator();
}

window.addEventListener('load', () => setTimeout(ensureNavigator, 0), { once: true });

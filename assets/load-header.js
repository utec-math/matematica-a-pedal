// assets/load-header.js
(async function () {
  const placeholder = document.getElementById("header-placeholder");
  if (!placeholder) return;

  const headerRes = await fetch("/matematica-a-pedal/assets/header.html?v=5", { cache: "no-store" });
  placeholder.innerHTML = await headerRes.text();

  import('/matematica-a-pedal/assets/header-progress.js?v=1')
    .catch(err => console.error('No se pudo cargar el progreso del encabezado:', err));

  // Identidad de ruta, nombres coherentes, guía pedagógica y navegador inferior.
  import('/matematica-a-pedal/assets/route-ui.js?v=1')
    .catch(err => console.error('No se pudo cargar la interfaz del recorrido:', err));

  // Normaliza vocabulario antiguo visible: Unidad/Bloque/Capítulo -> Etapa/Paso.
  import('/matematica-a-pedal/assets/route-vocabulary.js?v=1')
    .catch(err => console.error('No se pudo normalizar el vocabulario del recorrido:', err));

  const dd = document.querySelector('.dropdown');
  const btn = dd?.querySelector('button');
  const menu = dd?.querySelector('.dropdown-menu');
  btn?.addEventListener('click', ()=>{
    const open = menu.style.display === 'block';
    menu.style.display = open ? 'none' : 'block';
    btn.setAttribute('aria-expanded', String(!open));
  });
  document.addEventListener('click', (e)=>{
    if(dd && !dd.contains(e.target)) { menu.style.display = 'none'; btn?.setAttribute('aria-expanded','false'); }
  });

  try {
    const navRes = await fetch("/matematica-a-pedal/assets/nav.json?v=1", { cache: "no-store" });
    const nav = await navRes.json();
    const container = document.getElementById("units-list");
    if (!container || !nav?.unidades?.length) return;

    container.innerHTML = "";
    nav.unidades.forEach(u => {
      const card = document.createElement('div');
      card.style.cssText = "border:1px solid #FFD580; border-radius:10px; padding:8px; background:#FFF6E6;";

      const h = document.createElement('a');
      h.href = u.href || "#";
      h.textContent = u.title || u.id;
      h.style.cssText = "display:block; color:#783f04; font-weight:700; margin-bottom:6px; text-decoration:none;";
      card.appendChild(h);

      if (Array.isArray(u.bloques) && u.bloques.length) {
        const ul = document.createElement('ul');
        ul.style.cssText = "list-style:none; padding-left:0; margin:0; display:flex; flex-direction:column; gap:4px;";
        u.bloques.forEach(b => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = b.href ? b.href : ((u.href || "#") + (b.hash || ""));
          a.textContent = b.title || "Paso";
          a.style.cssText = "color:#7f6000; text-decoration:none;";
          li.appendChild(a);
          ul.appendChild(li);
        });
        card.appendChild(ul);
      }

      container.appendChild(card);
    });
  } catch (e) {
    console.error("No se pudo cargar nav.json", e);
  }
})();
window.dispatchEvent(new Event("map:header-ready"));

// ---- Compatibilidad de navegación inferior de páginas antiguas
// route-ui.js vuelve a renderizar el navegador con nombres pedagógicos completos.
(function () {
  const BASE = '/matematica-a-pedal/';

  const routes = {
    unidad0: ['index.html', 'bloque-a.html', 'bloque-b.html', 'bloque-c.html', 'bloque-d.html', 'bloque-e.html', 'mini-evaluacion.html'],
    unidad1: ['index.html', 'bloque-a.html', 'bloque-b.html', 'bloque-c.html', 'bloque-d.html', 'bloque-e.html', 'bloque-f.html', 'bloque-g.html', 'mini-evaluacion.html'],
    unidad2: ['index.html', 'bloque-a.html', 'bloque-b.html', 'bloque-c.html', 'bloque-d.html', 'bloque-e.html', 'mini-evaluacion.html'],
    unidad3: ['index.html', 'bloque-a.html', 'bloque-b.html', 'bloque-c.html', 'bloque-d.html', 'bloque-e.html', 'mini-evaluacion.html'],
    unidad4: ['index.html', 'bloque-a.html', 'bloque-b.html', 'bloque-c.html', 'bloque-d.html', 'bloque-e.html', 'bloque-f.html', 'mini-evaluacion.html']
  };

  const routeLabels = {
    unidad0: {
      'index.html': 'Punto de partida',
      'bloque-a.html': 'Chequeo A',
      'bloque-b.html': 'Chequeo B',
      'bloque-c.html': 'Chequeo C',
      'bloque-d.html': 'Chequeo D',
      'bloque-e.html': 'Chequeo E',
      'mini-evaluacion.html': 'Chequeo final'
    },
    unidad1: {
      'index.html': 'Inicio de etapa',
      'bloque-a.html': 'Conjuntos numéricos',
      'bloque-b.html': 'Propiedades',
      'bloque-c.html': 'Suma y resta',
      'bloque-d.html': 'Multiplicación y división',
      'bloque-e.html': 'Fracciones equivalentes',
      'bloque-f.html': 'Operaciones con fracciones',
      'bloque-g.html': 'Decimales ↔ fracciones',
      'mini-evaluacion.html': 'Cierre de etapa'
    },
    unidad2: {
      'index.html': 'Inicio de etapa',
      'bloque-a.html': 'Expresiones y polinomios',
      'bloque-b.html': 'Operaciones algebraicas',
      'bloque-c.html': 'Productos notables',
      'bloque-d.html': 'Factorización',
      'bloque-e.html': 'Fracciones algebraicas',
      'mini-evaluacion.html': 'Cierre de etapa'
    },
    unidad3: {
      'index.html': 'Inicio de etapa',
      'bloque-a.html': 'Origen y aplicaciones',
      'bloque-b.html': 'Medida de ángulos',
      'bloque-c.html': 'Relaciones entre ángulos',
      'bloque-d.html': 'Razones trigonométricas',
      'bloque-e.html': 'Círculo unitario',
      'mini-evaluacion.html': 'Cierre de etapa'
    },
    unidad4: {
      'index.html': 'Inicio de etapa',
      'bloque-a.html': 'Potenciación',
      'bloque-b.html': 'Radicación',
      'bloque-c.html': 'Radicales semejantes',
      'bloque-d.html': 'Notación científica',
      'bloque-e.html': 'Calculadora interactiva',
      'bloque-f.html': 'Práctica y autoevaluación',
      'mini-evaluacion.html': 'Cierre de etapa'
    }
  };

  const nextStageLabels = {
    0: '1️⃣ Números y operaciones ➡️',
    1: '2️⃣ Álgebra en acción ➡️',
    2: '3️⃣ Trigonometría ➡️',
    3: '4️⃣ Potencias y raíces ➡️'
  };

  const legacyU4 = {
    'capitulo1.html': 'bloque-a.html',
    'capitulo2.html': 'bloque-b.html',
    'capitulo3.html': 'bloque-c.html',
    'capitulo4.html': 'bloque-d.html',
    'capitulo5.html': 'bloque-e.html',
    'capitulo6.html': 'bloque-f.html'
  };

  const u4ChecklistLabels = {
    c1: 'Paso 1 — Potencias y exponentes',
    c2: 'Paso 2 — Raíces y exponentes fraccionarios',
    c3: 'Paso 3 — Simplificar radicales',
    c4: 'Paso 4 — Notación científica',
    c5: 'Paso 5 — Laboratorio interactivo',
    c6: 'Paso 6 — Práctica final'
  };

  function pageLabel(unitKey, file) {
    return routeLabels[unitKey]?.[file] || file;
  }

  function unitNumber(unitKey) {
    return Number(unitKey.replace('unidad', ''));
  }

  function unitHref(unitKey, file) {
    return `${BASE}${unitKey}/${file}`;
  }

  function makeButton(href, text, side) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    a.style.cssText = [
      'text-decoration:none',
      'color:#783f04',
      'background:#fff',
      'border:1px solid #FFD580',
      'border-radius:10px',
      'padding:8px 14px',
      'display:inline-block',
      side === 'left' ? 'justify-self:start' : 'justify-self:end'
    ].join(';');
    return a;
  }

  function findExistingNavigator() {
    const candidates = Array.from(document.querySelectorAll('div, section')).filter(el => {
      const directAnchors = Array.from(el.children).filter(child => child.tagName === 'A');
      if (!directAnchors.length) return false;
      return directAnchors.some(a => /Introducción|Bloque|Mini[\s-]?evaluación|Volver al inicio|Capítulo|Unidad\s+\d|Punto de partida|Chequeo|Etapa/i.test(a.textContent || ''));
    });
    return candidates[candidates.length - 1] || null;
  }

  function normalizeBottomNavigation() {
    const match = window.location.pathname.match(/\/matematica-a-pedal\/(unidad[0-4])\/?([^/]*)$/);
    if (!match) return;

    const unitKey = match[1];
    const file = match[2] || 'index.html';
    const sequence = routes[unitKey];
    const index = sequence?.indexOf(file) ?? -1;
    if (!sequence || index < 0) return;

    let previous = null;
    let next = null;

    if (index > 0) {
      const prevFile = sequence[index - 1];
      previous = {
        href: unitHref(unitKey, prevFile),
        text: `⬅️ ${pageLabel(unitKey, prevFile)}`
      };
    }

    if (index < sequence.length - 1) {
      const nextFile = sequence[index + 1];
      next = {
        href: unitHref(unitKey, nextFile),
        text: `${pageLabel(unitKey, nextFile)} ➡️`
      };
    } else {
      const n = unitNumber(unitKey);
      if (n < 4) {
        next = {
          href: `${BASE}unidad${n + 1}/index.html`,
          text: nextStageLabels[n] || `Etapa ${n + 1} ➡️`
        };
      } else {
        next = {
          href: BASE,
          text: '🏁 Volver al inicio'
        };
      }
    }

    let nav = findExistingNavigator();
    if (!nav) {
      nav = document.createElement('div');
      const host = document.querySelector('main') || document.body;
      host.appendChild(nav);
    }

    nav.classList.add('map-unit-nav');
    nav.innerHTML = '';
    nav.style.display = 'grid';
    nav.style.gridTemplateColumns = 'minmax(0,1fr) auto minmax(0,1fr)';
    nav.style.alignItems = 'center';
    nav.style.gap = '8px';
    nav.style.margin = '12px auto 0';
    nav.style.maxWidth = '1180px';
    nav.style.boxSizing = 'border-box';
    nav.style.background = '#FFF6E6';
    nav.style.border = '1px solid #FFD580';
    nav.style.borderRadius = '12px';
    nav.style.padding = '12px';
    nav.style.fontFamily = "'Roboto Mono', monospace";

    if (previous) {
      nav.appendChild(makeButton(previous.href, previous.text, 'left'));
    } else {
      const spacer = document.createElement('span');
      spacer.setAttribute('aria-hidden', 'true');
      nav.appendChild(spacer);
    }

    const center = document.createElement('span');
    center.textContent = unitKey === 'unidad0' ? 'Seguí calentando' : 'Continuá pedaleando';
    center.style.cssText = 'color:#7f6000; font-size:14px; text-align:center; white-space:nowrap;';
    nav.appendChild(center);

    if (next) {
      nav.appendChild(makeButton(next.href, next.text, 'right'));
    } else {
      const spacer = document.createElement('span');
      spacer.setAttribute('aria-hidden', 'true');
      nav.appendChild(spacer);
    }
  }

  function fixLegacyU4Links() {
    document.querySelectorAll('a[href]').forEach(a => {
      let href = a.getAttribute('href') || '';
      let fixed = href;
      Object.entries(legacyU4).forEach(([oldName, newName]) => {
        fixed = fixed.replace(oldName, newName);
      });
      if (fixed !== href) a.setAttribute('href', fixed);
    });
  }

  function normalizeU4ChecklistLabels() {
    document.querySelectorAll('#u4-home .u4-done[data-key]').forEach(input => {
      const text = input.closest('label')?.querySelector('span');
      const replacement = u4ChecklistLabels[input.dataset.key];
      if (text && replacement) text.textContent = replacement;
    });
  }

  function runNavigationNormalization() {
    fixLegacyU4Links();
    normalizeU4ChecklistLabels();
    normalizeBottomNavigation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runNavigationNormalization, { once: true });
  } else {
    setTimeout(runNavigationNormalization, 0);
  }

  document.addEventListener('change', e => {
    if (e.target?.matches?.('.u4-done')) setTimeout(fixLegacyU4Links, 0);
  }, true);
  window.addEventListener('map:progress-updated', () => setTimeout(fixLegacyU4Links, 0));
})();

// ---- Registro automático de páginas completadas
if (/\/matematica-a-pedal\/unidad[0-4](?:\/|$)/.test(window.location.pathname)) {
  import('/matematica-a-pedal/assets/completion-tracker.js?v=1')
    .catch(err => console.error('No se pudo cargar el seguimiento automático de progreso:', err));
}

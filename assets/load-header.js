// assets/load-header.js

// ---- Notación global de fracciones
// Se instala mientras el documento todavía se está parseando, antes de que los
// scripts defer de MathJax hagan el primer render. Así evitamos barras inclinadas
// en expresiones simples y también normalizamos fracciones numéricas de texto.
(function installFractionNotationNormalizer() {
  if (window.__MAP_FRACTION_NORMALIZER__) return;
  window.__MAP_FRACTION_NORMALIZER__ = true;

  const skipSelector = [
    'script','style','code','pre','textarea','input','button','option','a',
    'mjx-container','#header-placeholder','.map-unit-nav','#map-completion-status',
    '.unit-progress','.stage-meta'
  ].join(',');

  function shouldSkip(node) {
    const parent = node?.parentElement;
    return !parent || Boolean(parent.closest(skipSelector));
  }

  function normalizeTex(tex) {
    // Átomos simples: números, una variable, un comando TeX o una expresión entre paréntesis.
    // No convertimos palabras completas para no transformar textos como "opuesto / hipotenusa".
    const atom = String.raw`(?:\\[A-Za-z]+|[A-Za-z]|\d+(?:\.\d+)?)(?:\^\{?[-+A-Za-z0-9]+\}?)?|\([^()]+\)`;
    const slashFraction = new RegExp(`(${atom})\\s*\\/\\s*(${atom})`, 'g');
    let previous = '';
    let current = tex;
    while (previous !== current) {
      previous = current;
      current = current.replace(slashFraction, '\\frac{$1}{$2}');
    }
    return current;
  }

  function normalizeDelimitedMath(text) {
    return text
      .replace(/\\\(([\s\S]*?)\\\)/g, (_, tex) => `\\(${normalizeTex(tex)}\\)`)
      .replace(/\\\[([\s\S]*?)\\\]/g, (_, tex) => `\\[${normalizeTex(tex)}\\]`)
      .replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => `$$${normalizeTex(tex)}$$`)
      .replace(/\$([^$\n]+)\$/g, (_, tex) => `$${normalizeTex(tex)}$`);
  }

  function replacePlainNumericFractions(node) {
    const text = node.nodeValue || '';
    const re = /(?<![\d/])(-?\d{1,3})\s*\/\s*(-?\d{1,3})(?![\d/])/g;
    if (!re.test(text)) return;
    re.lastIndex = 0;

    const fragment = document.createDocumentFragment();
    let last = 0;
    let match;
    while ((match = re.exec(text))) {
      fragment.appendChild(document.createTextNode(text.slice(last, match.index)));
      const frac = document.createElement('span');
      frac.className = 'map-inline-fraction';
      frac.setAttribute('aria-label', `${match[1]} sobre ${match[2]}`);
      const top = document.createElement('span');
      const bottom = document.createElement('span');
      top.textContent = match[1];
      bottom.textContent = match[2];
      frac.append(top, bottom);
      fragment.appendChild(frac);
      last = match.index + match[0].length;
    }
    fragment.appendChild(document.createTextNode(text.slice(last)));
    node.replaceWith(fragment);
  }

  function normalizeTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE || shouldSkip(node)) return;
    const original = node.nodeValue || '';
    if (!original.trim()) return;

    if (/\\\(|\\\[|\$/.test(original)) {
      const normalized = normalizeDelimitedMath(original);
      if (normalized !== original) node.nodeValue = normalized;
      return;
    }

    replacePlainNumericFractions(node);
  }

  function scan(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      normalizeTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE && root.matches?.(skipSelector)) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(normalizeTextNode);
  }

  scan(document.body);

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'characterData') normalizeTextNode(mutation.target);
      mutation.addedNodes?.forEach(scan);
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  document.addEventListener('DOMContentLoaded', () => scan(document.body), { once: true });
  window.addEventListener('load', () => setTimeout(() => observer.disconnect(), 5000), { once: true });
})();

(async function () {
  const placeholder = document.getElementById("header-placeholder");
  if (!placeholder) return;

  // Unifica fondo, navegación y utilidades incluso en páginas antiguas que no cargan style.css.
  if (!document.getElementById('map-site-shell')) {
    const shell = document.createElement('link');
    shell.id = 'map-site-shell';
    shell.rel = 'stylesheet';
    shell.href = '/matematica-a-pedal/assets/site-shell.css?v=1';
    document.head.appendChild(shell);
  }

  if (!document.getElementById('map-ui-fixes')) {
    const fixes = document.createElement('link');
    fixes.id = 'map-ui-fixes';
    fixes.rel = 'stylesheet';
    fixes.href = '/matematica-a-pedal/assets/ui-fixes.css?v=1';
    document.head.appendChild(fixes);
  }

  const headerRes = await fetch("/matematica-a-pedal/assets/header.html?v=6", { cache: "no-store" });
  placeholder.innerHTML = await headerRes.text();

  // El encabezado es global, así que también debe ser global la sesión UTEC.
  // Usamos exactamente las mismas URLs que las páginas nuevas: el mapa de módulos
  // del navegador evita ejecutar dos veces firebase-init.js o cert-auth.js cuando
  // una página ya los incluye explícitamente.
  import('/matematica-a-pedal/assets/firebase-init.js')
    .then(() => import('/matematica-a-pedal/assets/cert-auth.js'))
    .catch(err => console.error('No se pudo inicializar la sesión UTEC del encabezado:', err));

  import('/matematica-a-pedal/assets/header-progress.js?v=1')
    .catch(err => console.error('No se pudo cargar el progreso del encabezado:', err));

  // route-ui.js reutiliza el navegador existente. nav-fallback.js entra solamente
  // si una página antigua realmente no trae navegador inferior.
  import('/matematica-a-pedal/assets/route-ui.js?v=2')
    .then(() => import('/matematica-a-pedal/assets/nav-fallback.js?v=1'))
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

// ---- Compatibilidad puntual de enlaces antiguos de la Etapa 4
// La navegación inferior ya NO se genera aquí: route-ui.js la administra por completo.
(function () {
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

  function fixLegacyU4Links() {
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href') || '';
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

  function runLegacyCompatibility() {
    fixLegacyU4Links();
    normalizeU4ChecklistLabels();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runLegacyCompatibility, { once: true });
  } else {
    setTimeout(runLegacyCompatibility, 0);
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

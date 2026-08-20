// assets/load-header.js
(async function () {
  const placeholder = document.getElementById("header-placeholder");
  if (!placeholder) return;

  const headerRes = await fetch("/matematica-a-pedal/assets/header.html?v=5", { cache: "no-store" });
  placeholder.innerHTML = await headerRes.text();

  import('/matematica-a-pedal/assets/header-progress.js?v=1')
    .catch(err => console.error('No se pudo cargar el progreso del encabezado:', err));

  // route-ui.js reutiliza el navegador inferior existente y solo actualiza sus nombres.
  import('/matematica-a-pedal/assets/route-ui.js?v=2')
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

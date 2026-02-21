// assets/load-header.js
(async function () {
  const placeholder = document.getElementById("header-placeholder");
  if (!placeholder) return;

  // Cargar el header sin caché
  const headerRes = await fetch("/matematica-a-pedal/assets/header.html?v=4", { cache: "no-store" });
  placeholder.innerHTML = await headerRes.text();

  // Dropdown básico
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

  // ---- Render dinámico del listado de unidades y sus bloques desde nav.json
  try {
    const navRes = await fetch("/matematica-a-pedal/assets/nav.json?v=1", { cache: "no-store" });
    const nav = await navRes.json();
    const container = document.getElementById("units-list");
    if (!container || !nav?.unidades?.length) return;

    // Limpio y vuelco
    container.innerHTML = "";
    nav.unidades.forEach(u => {
      // Tarjeta de cada unidad
      const card = document.createElement('div');
      card.style.cssText = "border:1px solid #FFD580; border-radius:10px; padding:8px; background:#FFF6E6;";

      // Título de unidad (link)
      const h = document.createElement('a');
      h.href = u.href || "#";
      h.textContent = u.title || u.id;
      h.style.cssText = "display:block; color:#783f04; font-weight:700; margin-bottom:6px; text-decoration:none;";
      card.appendChild(h);

      // Bloques internos (si existen)
      if (Array.isArray(u.bloques) && u.bloques.length) {
        const ul = document.createElement('ul');
        ul.style.cssText = "list-style:none; padding-left:0; margin:0; display:flex; flex-direction:column; gap:4px;";
        u.bloques.forEach(b => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          // Si el bloque trae hash, lo concatenamos; si no, usamos href directo
          a.href = b.href ? b.href : ((u.href || "#") + (b.hash || ""));
          a.textContent = b.title || "Bloque";
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
  // Avisar que el header ya está cargado e inyectado en el DOM
  window.dispatchEvent(new Event("map:header-ready"));

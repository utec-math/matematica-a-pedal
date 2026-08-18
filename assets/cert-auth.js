// assets/cert-auth.js
// El nombre del archivo se conserva por compatibilidad con las páginas existentes,
// pero este módulo ahora gestiona únicamente el inicio de sesión institucional UTEC.

function qs(id) {
  return document.getElementById(id);
}

function setMsg(text) {
  const el = qs("certMsg");
  if (el) el.textContent = text || "";
}

function updateUI(user) {
  const status = qs("certStatus");
  const btn = qs("btnCertLogin");
  if (!status || !btn) return false;

  btn.textContent = "🔐 Iniciar sesión con UTEC";

  if (user?.email && window.__MAP__?.isAllowedEmail?.(user.email)) {
    status.textContent = `Sesión iniciada: ${user.email}`;
    btn.style.display = "none";
    setMsg("");
  } else {
    status.textContent = "";
    btn.style.display = "inline-block";
  }

  return true;
}

// El header se inyecta de forma asíncrona, así que esperamos también a que aparezca su UI.
function syncHeaderUI() {
  if (updateUI(window.__MAP__?.auth?.currentUser)) return;

  const t0 = Date.now();
  const timer = setInterval(() => {
    if (updateUI(window.__MAP__?.auth?.currentUser) || Date.now() - t0 > 10000) {
      clearInterval(timer);
    }
  }, 100);
}

// Espera a que firebase-init haya creado window.__MAP__.
function waitForMAP(cb) {
  const t0 = Date.now();
  const timer = setInterval(() => {
    if (window.__MAP__?.auth && window.__MAP__?.db) {
      clearInterval(timer);
      cb();
    } else if (Date.now() - t0 > 10000) {
      clearInterval(timer);
      console.error("auth-ui: window.__MAP__ no está disponible (firebase-init no cargó).");
    }
  }, 100);
}

waitForMAP(() => {
  syncHeaderUI();

  // Mantiene el estado visual sincronizado con Firebase Authentication.
  window.__MAP__.onAuthStateChanged(window.__MAP__.auth, (user) => {
    updateUI(user);
    syncHeaderUI();
  });

  // Delegación: funciona aunque el header se inyecte después de cargar este módulo.
  document.addEventListener("click", async (e) => {
    if (e.target?.id !== "btnCertLogin") return;

    setMsg("");
    try {
      await window.__MAP__.signInWithUtec();
      updateUI(window.__MAP__.auth.currentUser);
    } catch (err) {
      console.error(err);
      setMsg(err?.message || "No se pudo iniciar sesión.");
    }
  });
});

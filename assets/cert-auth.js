// assets/cert-auth.js
// El nombre del archivo se conserva por compatibilidad con las páginas existentes,
// y gestiona el acceso con Google desde el encabezado compartido.

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

  if (user && !user.isAnonymous) {
    const institutional = window.__MAP__?.isAllowedEmail?.(user.email);
    const label = institutional ? "Sesión UTEC" : "Sesión con Google";
    status.textContent = user.email ? `${label}: ${user.email}` : label;
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
    const button = e.target?.closest?.("#btnCertLogin");
    if (!button || button.disabled) return;

    button.disabled = true;
    setMsg("");
    try {
      await window.__MAP__.signInWithGoogle();
      updateUI(window.__MAP__.auth.currentUser);
    } catch (err) {
      console.error(err);
      if (err?.code !== "auth/popup-closed-by-user") {
        setMsg("No se pudo continuar con Google. Probá de nuevo.");
      }
    } finally {
      button.disabled = false;
    }
  });
});

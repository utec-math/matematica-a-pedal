// assets/cert-auth.js
import {
  doc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const cohorts = [
  { id: "laa_calculo1_2026_s1", label: "Cálculo I (LAA) — Semestre 1" },
  { id: "imec_matematica1_2026_s2", label: "Matemática I (IMEC) — Semestre 2" }
];

function qs(id){ return document.getElementById(id); }

function renderCohorts() {
  const sel = qs("cohortSelect");
  if (!sel) return;
  sel.innerHTML = cohorts.map(c => `<option value="${c.id}">${c.label}</option>`).join("");
}

async function ensureEnrollment(user, cohortId, group) {
  const { db } = window.__MAP__;
  const email = user.email || "";
  const displayName = user.displayName || "";

  // users/{uid}
  await setDoc(doc(db, "users", user.uid), {
    email,
    displayName,
    lastSeenAt: serverTimestamp(),
    createdAt: serverTimestamp()
  }, { merge: true });

  // enrollments/{cohortId}/students/{uid}
  await setDoc(doc(db, "enrollments", cohortId, "students", user.uid), {
    email,
    displayName,
    group: group || "",
    enrolledAt: serverTimestamp()
  }, { merge: true });
}

function openModal() {
  const m = qs("certModal");
  if (m) m.style.display = "block";
}
function closeModal() {
  const m = qs("certModal");
  if (m) m.style.display = "none";
}

function setMsg(text) {
  const el = qs("certMsg");
  if (el) el.textContent = text || "";
}

function updateUI(u) {
  const status = qs("certStatus");
  const btn = qs("btnCertLogin");
  if (!status || !btn) return;

  if (u?.email && window.__MAP__?.isAllowedEmail?.(u.email)) {
    status.textContent = `Certificado: ${u.email}`;
    btn.style.display = "none";
  } else {
    status.textContent = "";
    btn.style.display = "inline-block";
  }
}

// Espera a que firebase-init haya creado window.__MAP__
function waitForMAP(cb) {
  const t0 = Date.now();
  const timer = setInterval(() => {
    if (window.__MAP__?.auth && window.__MAP__?.db) {
      clearInterval(timer);
      cb();
    } else if (Date.now() - t0 > 10000) {
      clearInterval(timer);
      console.error("cert-auth: window.__MAP__ no está disponible (firebase-init no cargó).");
    }
  }, 100);
}

waitForMAP(() => {
  // Observa login/logout para actualizar estado
  window.__MAP__.onAuthStateChanged(window.__MAP__.auth, (u) => updateUI(u));

  // Delegación: funciona aunque el header se inyecte luego
  document.addEventListener("click", async (e) => {
    const id = e.target?.id;

    // Click: Ingresar para certificado
    if (id === "btnCertLogin") {
      setMsg("");
      try {
        // Esto abre el popup de Google
        await window.__MAP__.signInForCertificate();
        renderCohorts();
        openModal();
      } catch (err) {
        console.error(err);
        setMsg(err?.message || "No se pudo iniciar sesión.");
      }
      return;
    }

    // Click: Cancelar modal
    if (id === "btnCertClose") {
      closeModal();
      return;
    }

    // Click: Guardar (matrícula/cohorte)
    if (id === "btnCertSave") {
      try {
        const user = window.__MAP__.auth.currentUser;
        if (!user || !user.email) {
          setMsg("Primero iniciá sesión con tu correo UTEC.");
          return;
        }
        const cohortId = qs("cohortSelect")?.value || "";
        const group = (qs("groupInput")?.value || "").trim();
        await ensureEnrollment(user, cohortId, group);
        closeModal();
        setMsg("✅ Registro guardado.");
      } catch (err) {
        console.error(err);
        setMsg(err?.message || "No se pudo guardar.");
      }
      return;
    }
  });
});

// assets/cert-auth.js
import {
  doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const cohorts = [
  { id: "laa_calculo1_2026_s1", label: "Cálculo I (LAA) — Semestre 1" },
  { id: "imec_matematica1_2026_s2", label: "Matemática I (IMEC) — Semestre 2" }
];

function qs(id){ return document.getElementById(id); }

function renderCohorts() {
  const sel = qs("cohortSelect");
  sel.innerHTML = cohorts.map(c => `<option value="${c.id}">${c.label}</option>`).join("");
}

async function ensureEnrollment(user, cohortId, group) {
  const { db } = window.__MAP__;
  const email = user.email || "";
  const displayName = user.displayName || "";

  // users/{uid}
  await setDoc(doc(db, "users", user.uid), {
    email, displayName,
    lastSeenAt: serverTimestamp(),
    createdAt: serverTimestamp()
  }, { merge: true });

  // enrollments/{cohortId}/students/{uid}
  await setDoc(doc(db, "enrollments", cohortId, "students", user.uid), {
    email, displayName,
    group: group || "",
    enrolledAt: serverTimestamp()
  }, { merge: true });
}

async function openModal() {
  qs("certModal").style.display = "block";
}
function closeModal() {
  qs("certModal").style.display = "none";
}

async function init() {
  renderCohorts();

  qs("btnCertLogin")?.addEventListener("click", async () => {
    qs("certMsg").textContent = "";
    try {
      await window.__MAP__.signInForCertificate();
      await openModal();
    } catch (e) {
      qs("certMsg").textContent = e.message || "No se pudo iniciar sesión.";
    }
  });

  qs("btnCertSave")?.addEventListener("click", async () => {
    const user = window.__MAP__.auth.currentUser;
    if (!user || !user.email) return;
    const cohortId = qs("cohortSelect").value;
    const group = qs("groupInput").value.trim();

    await ensureEnrollment(user, cohortId, group);
    closeModal();
  });

  qs("btnCertClose")?.addEventListener("click", closeModal);

  // Si ya está logueado con email permitido, ocultar botón y mostrar estado
  window.__MAP__.onAuthStateChanged(window.__MAP__.auth, (u) => {
    const status = qs("certStatus");
    const btn = qs("btnCertLogin");

    if (u?.email && window.__MAP__.isAllowedEmail(u.email)) {
      status.textContent = `Certificado: ${u.email}`;
      btn.style.display = "none";
    } else {
      status.textContent = "";
      btn.style.display = "inline-block";
    }
  });
}

window.addEventListener("map:header-ready", () => {
  init();
}, { once: true });

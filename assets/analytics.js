// Una sola integración GA4 para todo el sitio. No escribe contadores en Firestore.
const MEASUREMENT_ID = 'G-ZY88YE7ZJJ';

function cleanUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    // Los parámetros y fragmentos pueden contener información personal.
    return url.origin + url.pathname;
  } catch (_) {
    return '';
  }
}

async function startAnalytics() {
  // Evita contaminar los informes desde archivos locales, pruebas o copias.
  if (location.hostname !== 'utec-math.github.io' ||
      !location.pathname.startsWith('/matematica-a-pedal/') ||
      window.__MAP_ANALYTICS_STARTED__) return;
  window.__MAP_ANALYTICS_STARTED__ = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  const gtag = window.gtag;
  const page = {
    page_location: cleanUrl(location.href),
    page_referrer: cleanUrl(document.referrer)
  };
  let previousIdentity;
  let sentPageView = false;

  function updateIdentity(user, resolved, isAllowedEmail) {
    const institutional = resolved && user && !user.isAnonymous &&
      isAllowedEmail?.(user.email);
    const visitorType = !resolved ? 'desconocido' : institutional ? 'utec' : 'anonimo';
    // Las cuentas anónimas Firebase NO representan un ingreso institucional.
    const userId = institutional ? user.uid : null;
    const identity = JSON.stringify([visitorType, userId]);
    if (identity === previousIdentity) return;
    previousIdentity = identity;

    gtag('config', MEASUREMENT_ID, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      ...page,
      user_id: userId,
      visitor_type: visitorType
    });

    const parameters = { send_to: MEASUREMENT_ID, ...page, visitor_type: visitorType };
    if (!sentPageView) {
      sentPageView = true;
      gtag('event', 'page_view', parameters);
    } else {
      // Vincular una cuenta o salir de ella no agrega otra vista ni otra visita.
      gtag('event', 'auth_state_change', parameters);
    }
  }

  gtag('js', new Date());
  // Una caída de Firebase no debe impedir que se registre la visita.
  const fallback = setTimeout(() => updateIdentity(null, false), 3000);
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  try {
    // Misma URL que el encabezado: el navegador reutiliza la sesión existente.
    await import('/matematica-a-pedal/assets/firebase-init.js');
    const map = window.__MAP__;
    map.onIdTokenChanged(map.auth, user => {
      clearTimeout(fallback);
      updateIdentity(user, true, map.isAllowedEmail);
    }, () => {
      clearTimeout(fallback);
      updateIdentity(null, false);
    });
  } catch (_) {
    clearTimeout(fallback);
    updateIdentity(null, false);
  }
}

startAnalytics().catch(err => console.warn('No se pudo inicializar Analytics:', err));

const BASE = '/matematica-a-pedal/';

const stages = [
  {
    key: 'unidad0',
    title: 'Punto de partida · Calentamiento matemático',
    center: 'Calentamiento',
    kind: 'warmup',
    pages: [
      ['index.html', 'Punto de partida', 'Calentamiento matemático'],
      ['bloque-a.html', 'Chequeo A · Conjuntos numéricos', 'Chequeo A — Conjuntos numéricos'],
      ['bloque-b.html', 'Chequeo B · Propiedades de las operaciones', 'Chequeo B — Propiedades de las operaciones'],
      ['bloque-c.html', 'Chequeo C · Fracciones', 'Chequeo C — Fracciones'],
      ['bloque-d.html', 'Chequeo D · Potencias y raíces', 'Chequeo D — Potencias y raíces'],
      ['bloque-e.html', 'Chequeo E · Notación científica', 'Chequeo E — Notación científica'],
      ['mini-evaluacion.html', 'Chequeo final', 'Chequeo final — ¿Listo para arrancar?']
    ]
  },
  {
    key: 'unidad1',
    title: 'Etapa 1 · Números y operaciones',
    center: 'Etapa 1',
    pages: [
      ['index.html', 'Inicio · Números y operaciones', 'Etapa 1 — Números y operaciones'],
      ['bloque-a.html', 'Paso 1 · Conjuntos numéricos', 'Conjuntos numéricos, paso a paso'],
      ['bloque-b.html', 'Paso 2 · Propiedades para calcular mejor', 'Propiedades para calcular mejor'],
      ['bloque-c.html', 'Paso 3 · Suma y resta con signos', 'Suma y resta con signos'],
      ['bloque-d.html', 'Paso 4 · Multiplicación y división', 'Multiplicación y división'],
      ['bloque-e.html', 'Paso 5 · Fracciones equivalentes', 'Fracciones equivalentes y simplificación'],
      ['bloque-f.html', 'Paso 6 · Operaciones con fracciones', 'Operaciones con fracciones'],
      ['bloque-g.html', 'Paso 7 · Decimales y fracciones', 'Decimales ↔ fracciones'],
      ['mini-evaluacion.html', 'Parada de control · Etapa 1', 'Parada de control — Etapa 1']
    ]
  },
  {
    key: 'unidad2',
    title: 'Etapa 2 · Álgebra en acción',
    center: 'Etapa 2',
    pages: [
      ['index.html', 'Inicio · Álgebra en acción', 'Etapa 2 — Álgebra en acción'],
      ['bloque-a.html', 'Paso 1 · Expresiones y polinomios', 'Del lenguaje común a expresiones y polinomios'],
      ['bloque-b.html', 'Paso 2 · Operar expresiones', 'Operar expresiones algebraicas'],
      ['bloque-c.html', 'Paso 3 · Productos notables', 'Productos notables'],
      ['bloque-d.html', 'Paso 4 · Factorizar para simplificar', 'Factorizar para simplificar'],
      ['bloque-e.html', 'Paso 5 · Fracciones algebraicas', 'Fracciones algebraicas'],
      ['mini-evaluacion.html', 'Parada de control · Etapa 2', 'Parada de control — Etapa 2']
    ]
  },
  {
    key: 'unidad3',
    title: 'Etapa 3 · Trigonometría',
    center: 'Etapa 3',
    pages: [
      ['index.html', 'Inicio · Trigonometría', 'Etapa 3 — Trigonometría'],
      ['bloque-a.html', 'Paso 1 · Origen y aplicaciones', '¿Para qué sirve la trigonometría?'],
      ['bloque-b.html', 'Paso 2 · Medir ángulos', 'Medir ángulos: grados y radianes'],
      ['bloque-c.html', 'Paso 3 · Relaciones entre ángulos', 'Relaciones entre ángulos'],
      ['bloque-d.html', 'Paso 4 · Razones trigonométricas', 'Razones trigonométricas en triángulos'],
      ['bloque-e.html', 'Paso 5 · Círculo unitario', 'El círculo unitario'],
      ['mini-evaluacion.html', 'Parada de control · Etapa 3', 'Parada de control — Etapa 3']
    ]
  },
  {
    key: 'unidad4',
    title: 'Etapa 4 · Potencias y raíces',
    center: 'Etapa 4',
    pages: [
      ['index.html', 'Inicio · Potencias y raíces', 'Etapa 4 — Potencias y raíces'],
      ['bloque-a.html', 'Paso 1 · Potencias y exponentes', 'Potencias y exponentes'],
      ['bloque-b.html', 'Paso 2 · Raíces y exponentes fraccionarios', 'Raíces y exponentes fraccionarios'],
      ['bloque-c.html', 'Paso 3 · Simplificar radicales', 'Simplificar y operar con radicales'],
      ['bloque-d.html', 'Paso 4 · Notación científica', 'Notación científica'],
      ['bloque-e.html', 'Paso 5 · Laboratorio interactivo', 'Laboratorio interactivo de potencias y raíces'],
      ['bloque-f.html', 'Paso 6 · Práctica final', 'Práctica final guiada'],
      ['mini-evaluacion.html', 'Parada de control · Etapa 4', 'Parada de control — Etapa 4']
    ]
  }
];

const guides = {
  '/matematica-a-pedal/unidad1/bloque-b.html': {
    idea: 'Antes de aplicar una propiedad, mirá qué cambia: el orden, la agrupación o la distribución de un factor.',
    steps: ['Partimos de 3(8 + 2).', 'La distributiva multiplica 3 por cada término: 3·8 + 3·2.', 'Calculamos: 24 + 6 = 30.'],
    try: 'Probá con 4(5 + 3). ¿Qué propiedad usás y cuánto da?',
    answer: 'Distributiva: 4·5 + 4·3 = 20 + 12 = 32.'
  },
  '/matematica-a-pedal/unidad1/bloque-c.html': {
    idea: 'En sumas y restas con signos conviene transformar primero la resta en suma del opuesto.',
    steps: ['Partimos de −5 − (−2).', 'Restar −2 equivale a sumar su opuesto: −5 + 2.', 'El resultado es −3.'],
    try: 'Resolvé 7 − (−4) siguiendo el mismo procedimiento.',
    answer: '7 − (−4) = 7 + 4 = 11.'
  },
  '/matematica-a-pedal/unidad1/bloque-d.html': {
    idea: 'Separá dos decisiones: primero el signo del resultado y después el cálculo con los valores absolutos.',
    steps: ['En (−12) ÷ 3 los signos son distintos, así que el resultado será negativo.', 'Calculamos 12 ÷ 3 = 4.', 'Resultado: −4.'],
    try: 'Calculá (−18) ÷ (−6).',
    answer: 'Signos iguales → positivo; 18 ÷ 6 = 3. Resultado: 3.'
  },
  '/matematica-a-pedal/unidad1/bloque-e.html': {
    idea: 'Simplificar no cambia el valor de una fracción: divide numerador y denominador por el mismo factor.',
    steps: ['Queremos simplificar 18/24.', 'El MCD de 18 y 24 es 6.', 'Dividimos ambos por 6: 18/24 = 3/4.'],
    try: 'Simplificá 42/56.',
    answer: 'MCD(42,56)=14; 42/56 = 3/4.'
  },
  '/matematica-a-pedal/unidad1/bloque-f.html': {
    idea: 'Para sumar o restar fracciones con distinto denominador, primero hacé que las partes sean comparables usando un denominador común.',
    steps: ['2/3 + 5/4.', 'MCM(3,4)=12: 2/3=8/12 y 5/4=15/12.', 'Sumamos: 23/12.'],
    try: 'Calculá 3/5 + 1/4.',
    answer: 'MCM(5,4)=20; 12/20 + 5/20 = 17/20.'
  },
  '/matematica-a-pedal/unidad1/bloque-g.html': {
    idea: 'Un decimal finito siempre puede escribirse sobre una potencia de 10 y luego simplificarse.',
    steps: ['0,125 tiene tres cifras decimales.', '0,125 = 125/1000.', 'Simplificamos dividiendo por 125: 1/8.'],
    try: 'Convertí 0,45 en fracción irreducible.',
    answer: '0,45 = 45/100 = 9/20.'
  },
  '/matematica-a-pedal/unidad2/bloque-a.html': {
    idea: 'En álgebra primero identificamos términos, variables y exponentes; recién después operamos.',
    steps: ['En 3x²y − 5x hay dos términos.', 'El primer término tiene grado 2+1=3 y el segundo grado 1.', 'El grado del polinomio es 3.'],
    try: '¿Cuántos términos y qué grado tiene 2a³ − 4a + 1?',
    answer: 'Tiene 3 términos y grado 3.'
  },
  '/matematica-a-pedal/unidad2/bloque-b.html': {
    idea: 'Solo se combinan términos semejantes: deben tener exactamente la misma parte literal.',
    steps: ['Sumamos (3x²+5x−2)+(4x²−3x+7).', 'Agrupamos semejantes: (3+4)x² +(5−3)x + (−2+7).', 'Resultado: 7x² + 2x + 5.'],
    try: 'Simplificá (2x²+3x−1)+(5x²−x+4).',
    answer: '7x² + 2x + 3.'
  },
  '/matematica-a-pedal/unidad2/bloque-c.html': {
    idea: 'Un producto notable es un atajo, pero conviene entender de dónde sale antes de memorizarlo.',
    steps: ['(x+3)² significa (x+3)(x+3).', 'Distribuimos: x²+3x+3x+9.', 'Combinamos: x²+6x+9.'],
    try: 'Desarrollá (x−4)².',
    answer: 'x² − 8x + 16.'
  },
  '/matematica-a-pedal/unidad2/bloque-d.html': {
    idea: 'Factorizar es leer una suma o resta como un producto. Empezá siempre buscando factor común.',
    steps: ['6x³ − 9x².', 'Ambos términos comparten 3x².', 'Sacamos factor común: 3x²(2x−3).'],
    try: 'Factorizá 8x² − 12x.',
    answer: '4x(2x−3).'
  },
  '/matematica-a-pedal/unidad2/bloque-e.html': {
    idea: 'En una fracción algebraica se simplifican factores, nunca términos separados por suma o resta.',
    steps: ['(x²−9)/(x−3).', 'Factorizamos: (x−3)(x+3)/(x−3).', 'Simplificamos el factor común: x+3, manteniendo la restricción x≠3.'],
    try: 'Simplificá (x²−4)/(x−2) e indicá la restricción.',
    answer: 'x+2, con x≠2.'
  },
  '/matematica-a-pedal/unidad3/bloque-a.html': {
    idea: 'La trigonometría aparece cuando queremos relacionar ángulos con longitudes que no podemos medir directamente.',
    steps: ['Imaginá una altura h, una distancia horizontal de 20 m y un ángulo de elevación de 35°.', 'La tangente relaciona cateto opuesto y adyacente: tan 35° = h/20.', 'Despejamos: h = 20·tan 35°.'],
    try: 'Si conocés una altura y la hipotenusa, ¿qué razón trigonométrica relaciona directamente esas dos cantidades?',
    answer: 'El seno: sen θ = cateto opuesto / hipotenusa.'
  },
  '/matematica-a-pedal/unidad3/bloque-b.html': {
    idea: 'Grados y radianes miden lo mismo con escalas distintas. La equivalencia clave es 180° = π rad.',
    steps: ['Convertimos 120° a radianes.', 'Multiplicamos por π/180: 120·π/180.', 'Simplificamos: 2π/3 rad.'],
    try: 'Convertí 45° a radianes.',
    answer: '45·π/180 = π/4 rad.'
  },
  '/matematica-a-pedal/unidad3/bloque-c.html': {
    idea: 'Para clasificar relaciones entre ángulos, empezá sumando sus medidas.',
    steps: ['25° + 65° = 90°.', 'Dos ángulos que suman 90° son complementarios.', 'Entonces 25° y 65° son complementarios.'],
    try: '¿Qué relación tienen 110° y 70°?',
    answer: 'Suman 180°, por lo tanto son suplementarios.'
  },
  '/matematica-a-pedal/unidad3/bloque-d.html': {
    idea: 'Antes de elegir seno, coseno o tangente, nombrá hipotenusa, cateto opuesto y cateto adyacente respecto del ángulo.',
    steps: ['En un triángulo 3–4–5, tomemos como opuesto 3 y adyacente 4.', 'sen θ=3/5, cos θ=4/5.', 'tan θ=3/4.'],
    try: 'En un triángulo 5–12–13, con opuesto 5 y adyacente 12, hallá sen, cos y tan.',
    answer: 'sen=5/13, cos=12/13, tan=5/12.'
  },
  '/matematica-a-pedal/unidad3/bloque-e.html': {
    idea: 'En el círculo unitario, cos θ es la coordenada x y sen θ la coordenada y. El cuadrante determina los signos.',
    steps: ['150° está en el II cuadrante y su ángulo de referencia es 30°.', 'En II: seno positivo y coseno negativo.', 'sen150°=1/2 y cos150°=−√3/2.'],
    try: 'Determiná los signos de seno y coseno para 210°.',
    answer: '210° está en el III cuadrante: seno negativo y coseno negativo.'
  },
  '/matematica-a-pedal/unidad4/bloque-a.html': {
    idea: 'Las propiedades de potencias dependen de la operación. Antes de tocar exponentes, identificá si multiplicás, dividís o elevás otra potencia.',
    steps: ['2³·2⁻¹ tiene la misma base.', 'En un producto sumamos exponentes: 3+(−1)=2.', 'Resultado: 2²=4.'],
    try: 'Simplificá 5⁴/5².',
    answer: '5^(4−2)=5²=25.'
  },
  '/matematica-a-pedal/unidad4/bloque-b.html': {
    idea: 'Un exponente fraccionario combina potencia y raíz: a^(m/n) = ⁿ√(a^m).',
    steps: ['27^(2/3).', 'El denominador 3 indica raíz cúbica: ∛(27²).', 'Como ∛27=3, también podemos calcular 3²=9.'],
    try: 'Calculá 16^(3/4).',
    answer: '⁴√16 = 2 y 2³ = 8.'
  },
  '/matematica-a-pedal/unidad4/bloque-c.html': {
    idea: 'Para simplificar una raíz buscá dentro del radicando un factor que sea potencia perfecta del índice.',
    steps: ['√72.', '72=36·2 y 36 es cuadrado perfecto.', '√72=√36·√2=6√2.'],
    try: 'Simplificá √50.',
    answer: '√50=√(25·2)=5√2.'
  },
  '/matematica-a-pedal/unidad4/bloque-d.html': {
    idea: 'En notación científica el coeficiente debe quedar entre 1 y 10 en valor absoluto.',
    steps: ['0,00045.', 'Movemos la coma 4 lugares a la derecha para obtener 4,5.', 'Resultado: 4,5·10⁻⁴.'],
    try: 'Escribí 7 200 000 en notación científica.',
    answer: '7,2·10⁶.'
  },
  '/matematica-a-pedal/unidad4/bloque-e.html': {
    idea: 'Usá la calculadora como laboratorio: primero predecí, después calculá y finalmente explicá por qué el resultado tiene sentido.',
    steps: ['Predecí 8^(2/3).', 'Pensalo como (∛8)².', '∛8=2 y 2²=4; recién después verificá en la app.'],
    try: 'Antes de usar la app, predecí 16^(−3/4).',
    answer: '16^(3/4)=8; el exponente negativo toma el recíproco: 1/8.'
  },
  '/matematica-a-pedal/unidad4/bloque-f.html': {
    idea: 'En la práctica final no busques una fórmula de memoria: identificá el tipo de problema, elegí la propiedad y verificá el resultado.',
    steps: ['Para 7³·7⁻⁵ identificamos producto de igual base.', 'Sumamos exponentes: 3+(−5)=−2.', '7⁻²=1/49.'],
    try: 'Aplicá la misma estrategia a 2⁴·2⁻⁹/2⁻³.',
    answer: '2^(4−9−(−3))=2⁻²=1/4.'
  }
};

const routes = [];
const byPath = new Map();

stages.forEach((stage, stageIndex) => {
  stage.pages.forEach((page, index) => {
    const [file, nav, heading] = page;
    const path = `${BASE}${stage.key}/${file}`;
    const isIndex = file === 'index.html';
    const isFinal = file === 'mini-evaluacion.html';
    const stepIndex = isIndex || isFinal ? null : index;
    const totalSteps = stage.pages.length - 2;
    const meta = {
      stage,
      stageIndex,
      file,
      path,
      nav,
      heading,
      index,
      isIndex,
      isFinal,
      stepIndex,
      totalSteps,
      menu: stage.kind === 'warmup'
        ? (isIndex ? 'Punto de partida' : isFinal ? 'Chequeo final' : nav)
        : (isIndex ? 'Inicio de la etapa' : isFinal ? 'Parada de control' : nav),
      card: stage.kind === 'warmup'
        ? nav
        : (isIndex ? stage.title : isFinal ? '🏁 Parada de control' : nav)
    };
    routes.push(meta);
    byPath.set(path, meta);
  });
});

function normalizePath(pathname) {
  const legacy = {
    '/matematica-a-pedal/unidad4/capitulo1.html': '/matematica-a-pedal/unidad4/bloque-a.html',
    '/matematica-a-pedal/unidad4/capitulo2.html': '/matematica-a-pedal/unidad4/bloque-b.html',
    '/matematica-a-pedal/unidad4/capitulo3.html': '/matematica-a-pedal/unidad4/bloque-c.html',
    '/matematica-a-pedal/unidad4/capitulo4.html': '/matematica-a-pedal/unidad4/bloque-d.html',
    '/matematica-a-pedal/unidad4/capitulo5.html': '/matematica-a-pedal/unidad4/bloque-e.html',
    '/matematica-a-pedal/unidad4/capitulo6.html': '/matematica-a-pedal/unidad4/bloque-f.html'
  };
  if (legacy[pathname]) return legacy[pathname];
  if (/\/unidad[0-4]\/$/.test(pathname)) return `${pathname}index.html`;
  return pathname;
}

function metaFromHref(href) {
  try {
    const url = new URL(href, window.location.origin);
    return byPath.get(normalizePath(url.pathname)) || null;
  } catch (_) {
    return null;
  }
}

function pageEyebrow(meta) {
  if (meta.stage.kind === 'warmup') {
    if (meta.isIndex) return '🚲 PUNTO DE PARTIDA';
    if (meta.isFinal) return '🚲 CALENTAMIENTO · CHEQUEO FINAL';
    return `🚲 CALENTAMIENTO · CHEQUEO ${String.fromCharCode(64 + meta.stepIndex)} DE ${meta.totalSteps}`;
  }
  if (meta.isIndex) return `🚲 ${meta.stage.center.toUpperCase()} · INICIO`;
  if (meta.isFinal) return `🚲 ${meta.stage.center.toUpperCase()} · PARADA DE CONTROL`;
  return `🚲 ${meta.stage.center.toUpperCase()} · PASO ${meta.stepIndex} DE ${meta.totalSteps}`;
}

function contentH1() {
  return Array.from(document.querySelectorAll('h1')).find(h => !h.closest('#header-placeholder') && !h.closest('header')) || null;
}

function applyPageIdentity(meta) {
  document.title = `${meta.heading} · Matemática a Pedal`;
  const h1 = contentH1();
  if (!h1) return;
  h1.textContent = meta.heading;

  const parent = h1.parentElement;
  if (!parent) return;
  let eyebrow = parent.querySelector(':scope > .map-route-eyebrow');
  const previous = h1.previousElementSibling;
  if (!eyebrow && previous && previous.textContent.trim().length < 90 && /(UNIDAD|ETAPA|PUNTO DE PARTIDA|CALENTAMIENTO)/i.test(previous.textContent)) {
    eyebrow = previous;
    eyebrow.classList.add('map-route-eyebrow');
  }
  if (!eyebrow) {
    eyebrow = document.createElement('div');
    eyebrow.className = 'map-route-eyebrow';
    eyebrow.style.cssText = 'font-size:13px;font-weight:800;letter-spacing:.06em;color:#7f6000;margin-bottom:5px;';
    parent.insertBefore(eyebrow, h1);
  }
  eyebrow.textContent = pageEyebrow(meta);
}

function applyHeaderNames() {
  document.querySelectorAll('#header-placeholder .submenu a[href]').forEach(a => {
    const meta = metaFromHref(a.getAttribute('href'));
    if (!meta) return;
    a.textContent = meta.menu;
    if (meta.isIndex) a.style.fontWeight = '800';
  });
}

function applyIndexNames(meta) {
  if (!meta?.isIndex) return;
  document.querySelectorAll('main article').forEach(article => {
    const link = article.querySelector('a[href]');
    const route = link ? metaFromHref(link.getAttribute('href')) : null;
    const h3 = article.querySelector('h3');
    if (route && h3) h3.textContent = route.card;
  });

  document.querySelectorAll('main h2').forEach(h2 => {
    const text = h2.textContent.trim();
    if (/Índice de capítulos|Índice de bloques/i.test(text)) {
      h2.textContent = meta.stage.kind === 'warmup' ? '🗺️ Tus chequeos' : '🗺️ Ruta de esta etapa';
    }
  });

  if (meta.stage.key === 'unidad3') {
    document.querySelectorAll('main li').forEach(li => {
      const text = li.textContent.trim();
      if (/Aplicar .*identidades trigonométricas/i.test(text)) {
        li.innerHTML = 'Reconocer y usar <b>relaciones entre ángulos</b>, incluidos complementarios, suplementarios y coterminales.';
      }
      if (/Modelar situaciones reales con .*funciones trigonométricas/i.test(text)) {
        li.innerHTML = 'Aplicar <b>razones trigonométricas</b> y el <b>círculo unitario</b> en problemas de medida y orientación.';
      }
    });
  }
}

function guideBox(meta) {
  const guide = guides[meta.path];
  if (!guide || document.querySelector('.map-learning-guide')) return;
  const h1 = contentH1();
  if (!h1) return;
  const hero = h1.parentElement;
  if (!hero?.parentElement) return;

  const box = document.createElement('section');
  box.className = 'map-learning-guide';
  box.style.cssText = 'margin-top:16px;border:1px solid #FFD580;border-radius:12px;padding:16px;background:#FFFDF8;font-family:\'Roboto Mono\',monospace;color:#7f6000;line-height:1.55;';
  box.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <h2 style="color:#783f04;margin:0;font-size:21px;">🪜 Antes de entrar al desarrollo</h2>
      <span style="font-size:12px;border:1px solid #FFD580;border-radius:999px;padding:3px 8px;background:#FFF6E6;">idea → ejemplo → práctica</span>
    </div>
    <p style="margin:10px 0 0;"><b>Idea clave.</b> ${guide.idea}</p>
    <div style="margin-top:12px;background:#FFF6E6;border-radius:10px;padding:12px;">
      <b style="color:#783f04;">Ejemplo guiado</b>
      <ol style="margin:8px 0 0 20px;">${guide.steps.map(step => `<li>${step}</li>`).join('')}</ol>
    </div>
    <div style="margin-top:10px;border:1px dashed #FFD580;border-radius:10px;padding:12px;">
      <b style="color:#783f04;">Ahora vos.</b> ${guide.try}
      <details style="margin-top:8px;"><summary style="cursor:pointer;color:#783f04;">✅ Comprobar</summary><p style="margin:8px 0 0;">${guide.answer}</p></details>
    </div>`;
  hero.insertAdjacentElement('afterend', box);
  try { window.MathJax?.typesetPromise?.([box]); } catch (_) {}
}

function findNavigator() {
  const ready = document.querySelector('[data-map-route-nav="true"]');
  if (ready) return ready;
  const candidates = Array.from(document.querySelectorAll('.map-unit-nav, div, section')).filter(el => {
    if (el.closest('#header-placeholder')) return false;
    const direct = Array.from(el.children).filter(ch => ch.tagName === 'A');
    if (!direct.length) return false;
    return direct.some(a => /Bloque|Capítulo|Unidad|Etapa|Chequeo|Mini|Punto de partida|Volver al inicio|Paso/i.test(a.textContent || ''));
  });
  return candidates[candidates.length - 1] || null;
}

function makeNavButton(href, text, side) {
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

function rebuildBottomNav(meta) {
  const currentIndex = routes.findIndex(r => r.path === meta.path);
  if (currentIndex < 0) return;
  const previous = currentIndex > 0 ? routes[currentIndex - 1] : null;
  const next = currentIndex < routes.length - 1 ? routes[currentIndex + 1] : null;

  let nav = findNavigator();
  if (!nav) {
    nav = document.createElement('div');
    (document.querySelector('main') || document.body).appendChild(nav);
  }
  nav.dataset.mapRouteNav = 'true';
  nav.classList.add('map-unit-nav');
  nav.innerHTML = '';
  nav.style.cssText = "display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:10px;margin:18px auto 12px;max-width:1180px;box-sizing:border-box;background:#FFF6E6;border:1px solid #FFD580;border-radius:12px;padding:12px;font-family:'Roboto Mono',monospace;";

  if (previous) nav.appendChild(makeNavButton(previous.path, `⬅️ ${previous.nav}`, 'left'));
  else nav.appendChild(document.createElement('span'));

  const center = document.createElement('span');
  center.textContent = `${meta.stage.center} · ${meta.index + 1}/${meta.stage.pages.length}`;
  center.style.cssText = 'color:#7f6000;font-size:13px;text-align:center;white-space:nowrap;';
  nav.appendChild(center);

  if (next) {
    nav.appendChild(makeNavButton(next.path, `${next.nav} ➡️`, 'right'));
  } else {
    nav.appendChild(makeNavButton(`${BASE}progreso.html`, '🏁 Ver mi progreso', 'right'));
  }
}

function rewriteProgressPage() {
  if (window.location.pathname !== `${BASE}progreso.html`) return;

  const replacements = new Map([
    ['Unidad 0 · Calentamiento Matemático', 'Punto de partida · Calentamiento matemático'],
    ['Unidad 1 · Conjuntos y Operaciones', 'Etapa 1 · Números y operaciones'],
    ['Unidad 2 · Factorización y Expresiones', 'Etapa 2 · Álgebra en acción'],
    ['Unidad 3 · Trigonometría', 'Etapa 3 · Trigonometría'],
    ['Unidad 4 · Potenciación, Radicación y Notación Científica', 'Etapa 4 · Potencias y raíces']
  ]);

  document.querySelectorAll('h2,h3,h4').forEach(el => {
    const replacement = replacements.get(el.textContent.trim());
    if (replacement) el.textContent = replacement;
  });

  document.querySelectorAll('a[href]').forEach(a => {
    if (a.closest('#header-placeholder')) return;
    const meta = metaFromHref(a.getAttribute('href'));
    if (!meta) return;
    if (/^(Introducción|Bloque|Capítulo|Mini|Cierre|Unidad)/i.test(a.textContent.trim())) {
      a.textContent = meta.nav;
    }
  });
}

function run() {
  applyHeaderNames();
  rewriteProgressPage();

  const path = normalizePath(window.location.pathname);
  const meta = byPath.get(path);
  if (!meta) return;

  applyPageIdentity(meta);
  applyIndexNames(meta);
  guideBox(meta);
  rebuildBottomNav(meta);
}

let observer = null;
function startProgressObserver() {
  if (window.location.pathname !== `${BASE}progreso.html`) return;
  observer = new MutationObserver(() => rewriteProgressPage());
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => observer?.disconnect(), 7000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    run();
    startProgressObserver();
    setTimeout(run, 120);
  }, { once: true });
} else {
  run();
  startProgressObserver();
  setTimeout(run, 120);
}

window.addEventListener('load', () => setTimeout(run, 0), { once: true });

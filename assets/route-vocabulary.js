const PATH = window.location.pathname;
const match = PATH.match(/\/matematica-a-pedal\/unidad([0-4])(?:\/|$)/);

function replaceVisibleText(root, replacements) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest('#header-placeholder')) return NodeFilter.FILTER_REJECT;
      if (parent.closest('script,style,noscript,textarea,pre,code')) return NodeFilter.FILTER_REJECT;
      return node.nodeValue?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach(node => {
    let text = node.nodeValue;
    replacements.forEach(([pattern, value]) => {
      text = text.replace(pattern, value);
    });
    node.nodeValue = text;
  });
}

function unitReplacements(unit) {
  const replacements = [];

  if (unit === 0) {
    replacements.push(
      [/UNIDAD 0/g, 'CALENTAMIENTO'],
      [/Unidad 0/g, 'Calentamiento'],
      [/unidad 0/g, 'calentamiento'],
      [/Mini-evaluación/g, 'Chequeo final'],
      [/mini-evaluación/g, 'chequeo final'],
      [/Mini Evaluación/g, 'Chequeo final']
    );
    ['A','B','C','D','E'].forEach(letter => {
      replacements.push([new RegExp(`Bloque ${letter}`, 'g'), `Chequeo ${letter}`]);
      replacements.push([new RegExp(`BLOQUE ${letter}`, 'g'), `CHEQUEO ${letter}`]);
    });
    replacements.push([/capítulo/gi, match => match[0] === 'C' ? 'Chequeo' : 'chequeo']);
    return replacements;
  }

  replacements.push(
    [new RegExp(`UNIDAD ${unit}`, 'g'), `ETAPA ${unit}`],
    [new RegExp(`Unidad ${unit}`, 'g'), `Etapa ${unit}`],
    [new RegExp(`unidad ${unit}`, 'g'), `etapa ${unit}`],
    [/Mini-evaluación/g, 'Parada de control'],
    [/mini-evaluación/g, 'parada de control'],
    [/Mini Evaluación/g, 'Parada de control'],
    [/Cierre de la unidad/g, 'Parada de control'],
    [/cierre de la unidad/g, 'parada de control']
  );

  const maxLetter = unit === 1 ? 7 : unit === 4 ? 6 : 5;
  for (let i = 1; i <= maxLetter; i += 1) {
    const letter = String.fromCharCode(64 + i);
    replacements.push([new RegExp(`Bloque ${letter}`, 'g'), `Paso ${i}`]);
    replacements.push([new RegExp(`BLOQUE ${letter}`, 'g'), `PASO ${i}`]);
  }

  replacements.push(
    [/Capítulo (\d+)/g, 'Paso $1'],
    [/CAPÍTULO (\d+)/g, 'PASO $1'],
    [/capítulo (\d+)/g, 'paso $1'],
    [/En el próximo capítulo/g, 'En el próximo paso'],
    [/En el próximo Capítulo/g, 'En el próximo paso'],
    [/Próximo capítulo/g, 'Próximo paso'],
    [/próximo capítulo/g, 'próximo paso']
  );

  return replacements;
}

function normalizeUnitPage() {
  if (!match) return;
  const unit = Number(match[1]);
  const root = document.querySelector('main') || Array.from(document.body.children).find(el => el.tagName === 'SECTION') || document.body;
  replaceVisibleText(root, unitReplacements(unit));
}

function normalizeProgressPage() {
  if (PATH !== '/matematica-a-pedal/progreso.html') return;
  const replacements = [
    [/Unidad 0 · Calentamiento Matemático/g, 'Punto de partida · Calentamiento matemático'],
    [/Unidad 0 · Calentamiento/g, 'Punto de partida · Calentamiento matemático'],
    [/Unidad 1 · Conjuntos y Operaciones/g, 'Etapa 1 · Números y operaciones'],
    [/Unidad 2 · Factorización y Expresiones/g, 'Etapa 2 · Álgebra en acción'],
    [/Unidad 3 · Trigonometría/g, 'Etapa 3 · Trigonometría'],
    [/Unidad 4 · Potenciación, Radicación y Notación Científica/g, 'Etapa 4 · Potencias y raíces'],
    [/Mini-evaluación/g, 'Parada de control'],
    [/mini-evaluación/g, 'parada de control']
  ];
  replaceVisibleText(document.querySelector('main') || document.body, replacements);
}

function run() {
  normalizeUnitPage();
  normalizeProgressPage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run, { once: true });
} else {
  run();
}

if (PATH === '/matematica-a-pedal/progreso.html') {
  const observer = new MutationObserver(run);
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 7000);
}

window.addEventListener('load', () => setTimeout(run, 0), { once: true });

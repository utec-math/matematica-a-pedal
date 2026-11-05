const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/analytics.js'), 'utf8')
  .replace("await import('/matematica-a-pedal/assets/firebase-init.js')", 'await loadFirebase()');

async function browser({ hostname = 'utec-math.github.io', failed = false } = {}) {
  const scripts = [];
  let observer;
  let timeout;
  const location = {
    hostname, pathname: '/matematica-a-pedal/unidad1/bloque-a.html',
    href: `https://${hostname}/matematica-a-pedal/unidad1/bloque-a.html?email=private#secret`
  };
  const window = { __MAP__: {
    auth: {},
    isAllowedEmail: email => typeof email === 'string' &&
      ['@utec.edu.uy', '@estudiantes.utec.edu.uy'].some(d => email.toLowerCase().endsWith(d)),
    onIdTokenChanged: (auth, next) => { observer = next; }
  }};
  const context = {
    window, location, URL, console,
    document: {
      referrer: 'https://example.com/path?token=private#private',
      createElement: () => ({}), head: { appendChild: script => scripts.push(script) }
    },
    setTimeout: fn => { timeout = fn; return 1; },
    clearTimeout: () => { timeout = undefined; },
    loadFirebase: async () => { if (failed) throw new Error('offline'); }
  };
  // Cada importación ES tiene su propio ámbito léxico, pero comparte window.
  const moduleSource = `(() => { ${source}\n})();`;
  vm.runInNewContext(moduleSource, context);
  await new Promise(resolve => setImmediate(resolve));
  return {
    scripts, observe: user => observer(user), expire: () => timeout?.(),
    repeat: () => vm.runInNewContext(moduleSource, context),
    commands: () => Array.from(window.dataLayer || [], args => JSON.parse(JSON.stringify([...args])))
  };
}

const views = b => b.commands().filter(c => c[0] === 'event' && c[1] === 'page_view');
const configs = b => b.commands().filter(c => c[0] === 'config');

test('una vista por documento, sin duplicación por renovación de token o vinculación de cuenta', async () => {
  const b = await browser();
  b.observe({ uid: 'same-uid', isAnonymous: true });
  b.observe({ uid: 'same-uid', isAnonymous: true });
  b.observe({ uid: 'same-uid', isAnonymous: false, email: 'persona@utec.edu.uy' });
  b.observe({ uid: 'same-uid', isAnonymous: false, email: 'persona@utec.edu.uy' });
  assert.equal(views(b).length, 1);
  assert.equal(configs(b).length, 2);
  assert.equal(configs(b)[0][2].user_id, null);
  assert.equal(configs(b)[0][2].visitor_type, 'anonimo');
  assert.equal(configs(b)[1][2].user_id, 'same-uid');
  assert.equal(configs(b)[1][2].visitor_type, 'utec');
  assert.equal(b.commands().filter(c => c[1] === 'auth_state_change').length, 1);
  assert.equal(configs(b).every(c => c[2].send_page_view === false), true);
});

test('sesión institucional restaurada, salida y cuenta no institucional', async () => {
  const b = await browser();
  b.observe({ uid: 'student-id', isAnonymous: false, email: 'persona@estudiantes.utec.edu.uy' });
  assert.equal(views(b)[0][2].visitor_type, 'utec');
  b.observe(null);
  assert.equal(configs(b).at(-1)[2].user_id, null);
  b.observe({ uid: 'outsider', isAnonymous: false, email: 'persona@evilutec.edu.uy' });
  assert.equal(configs(b).at(-1)[2].user_id, null);
  assert.equal(views(b).length, 1);
  assert.equal(JSON.stringify(b.commands()).includes('persona@'), false);
});

test('Firebase bloqueado o lento conserva una vista con estado desconocido', async () => {
  const blocked = await browser({ failed: true });
  assert.equal(views(blocked).length, 1);
  assert.equal(views(blocked)[0][2].visitor_type, 'desconocido');
  const slow = await browser();
  slow.expire();
  slow.observe({ uid: 'student-id', isAnonymous: false, email: 'persona@utec.edu.uy' });
  assert.equal(views(slow).length, 1);
  assert.equal(configs(slow).at(-1)[2].visitor_type, 'utec');
});

test('no envía parámetros URL, no activa publicidad y carga una sola etiqueta', async () => {
  const b = await browser();
  b.observe(null);
  b.repeat();
  assert.equal(b.scripts.length, 1);
  assert.equal(views(b).length, 1);
  assert.equal(views(b)[0][2].page_location, 'https://utec-math.github.io/matematica-a-pedal/unidad1/bloque-a.html');
  assert.equal(views(b)[0][2].page_referrer, 'https://example.com/path');
  assert.equal(JSON.stringify(b.commands()).includes('private'), false);
  assert.equal(configs(b)[0][2].allow_google_signals, false);
  assert.equal(configs(b)[0][2].allow_ad_personalization_signals, false);
});

test('las pruebas locales no contaminan Analytics', async () => {
  const b = await browser({ hostname: 'localhost' });
  assert.equal(b.commands().length, 0);
  assert.equal(b.scripts.length, 0);
});

test('todas las 42 páginas cargan el punto común y la portada no duplica GA4', () => {
  const root = path.join(__dirname, '..');
  function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      if (entry.name.startsWith('.')) return [];
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    });
  }
  const pages = walk(root).filter(file => file.endsWith('.html') && !file.includes(`${path.sep}assets${path.sep}`));
  assert.equal(pages.length, 42);
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8');
    assert.ok(html.includes('/matematica-a-pedal/assets/load-header.js'), file);
    assert.ok(!html.includes('googletagmanager.com/gtag/js'), file);
  }
  assert.ok(fs.readFileSync(path.join(root, 'assets/load-header.js'), 'utf8').includes("import('/matematica-a-pedal/assets/analytics.js?v=1')"));
});

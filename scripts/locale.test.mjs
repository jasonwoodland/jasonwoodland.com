import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { initLocaleSwitch } from '../public/assets/locale.js';

function fixture({ deniedStorage = false } = {}) {
  const handlers = {};
  const local = new Map();
  const session = new Map();
  const classes = new Set();
  const root = {
    classList: { add: name => classes.add(name), contains: name => classes.has(name) },
    style: { setProperty() {} },
    dataset: { locale: 'zh' }
  };
  const link = {
    href: 'https://jasonwoodland.com/zh/projects/',
    dataset: { localeLink: 'zh' },
    addEventListener: (name, handler) => { handlers['link:' + name] = handler; }
  };
  const storage = values => ({
    getItem(key) { if (deniedStorage) throw Error('Denied'); return values.get(key) ?? null; },
    setItem(key, value) { if (deniedStorage) throw Error('Denied'); values.set(key, value); },
    removeItem(key) { if (deniedStorage) throw Error('Denied'); values.delete(key); }
  });
  const document = { documentElement: root, querySelector: () => link };
  const window = {
    location: { href: 'https://jasonwoodland.com/projects/', pathname: '/projects/' },
    localStorage: storage(local), sessionStorage: storage(session),
    addEventListener: (name, handler) => { handlers[name] = handler; }
  };
  initLocaleSwitch({ document, window });
  return { document, window, root, link, local, session, classes, handlers };
}

test('language links retain ordinary navigation, remember the choice and disable outgoing animations', () => {
  const value = fixture();
  value.handlers['link:click']({ button: 0 });
  assert.equal(value.local.get('jasonwoodland.locale'), 'zh');
  assert.equal(value.session.get('jasonwoodland.instant-locale'), '/zh/projects/');
  assert.ok(value.classes.has('locale-navigation'));
  assert.equal(value.link.href, 'https://jasonwoodland.com/zh/projects/');
  let skipped = false;
  value.handlers.pageswap({ viewTransition: { skipTransition() { skipped = true; } } });
  assert.ok(skipped);
});

test('modified clicks leave storage and page animations alone', () => {
  for (const modifiers of [{ button: 1 }, { metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { defaultPrevented: true }]) {
    const value = fixture();
    value.handlers['link:click']({ button: 0, ...modifiers });
    assert.equal(value.local.size, 0);
    assert.equal(value.session.size, 0);
    assert.equal(value.classes.size, 0);
  }
});

test('language navigation still works when browser storage is unavailable', () => {
  const value = fixture({ deniedStorage: true });
  assert.doesNotThrow(() => value.handlers['link:click']({ button: 0 }));
  assert.ok(value.classes.has('locale-navigation'));
});

test('cached-page restoration clears the outgoing language-navigation flag', () => {
  const value = fixture();
  value.handlers['link:click']({ button: 0 });
  value.handlers.pageshow();
  let skipped = false;
  value.handlers.pageswap({ viewTransition: { skipTransition() { skipped = true; } } });
  assert.equal(skipped, false);
});

test('pre-paint setup suppresses incoming locale animations and preserves server-rendered language', async () => {
  const value = fixture();
  value.local.set('jasonwoodland.locale', 'en');
  value.session.set('jasonwoodland.instant-locale', '/zh/projects/');
  value.window.location.pathname = '/zh/projects/';
  runInNewContext(await readFile(new URL('../public/assets/page-init.js', import.meta.url), 'utf8'), {
    document: value.document, sessionStorage: value.window.sessionStorage,
    location: value.window.location, window: value.window
  });
  assert.equal(value.root.dataset.locale, 'zh');
  assert.ok(value.classes.has('locale-navigation'));
  assert.equal(value.session.size, 0);
  let skipped = false;
  value.handlers.pagereveal({ viewTransition: { skipTransition() { skipped = true; } } });
  assert.ok(skipped);
});

test('unrelated navigation keeps the usual page entrances', async () => {
  const value = fixture();
  value.session.set('jasonwoodland.instant-locale', '/zh/contact/');
  runInNewContext(await readFile(new URL('../public/assets/page-init.js', import.meta.url), 'utf8'), {
    document: value.document, sessionStorage: value.window.sessionStorage,
    location: value.window.location, window: value.window
  });
  assert.equal(value.classes.size, 0);
});

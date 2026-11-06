import test from 'node:test';
import assert from 'node:assert/strict';
import { initPageTransitions, navigationTarget } from '../public/assets/navigation.js';

const origin = 'https://jasonwoodland.com/';
function click(href, attributes = {}, modifiers = {}) {
  const link = { hasAttribute: name => Object.hasOwn(attributes, name), getAttribute: name => name === 'href' ? href : attributes[name] ?? null };
  return { button: 0, target: { closest: () => link }, preventDefault() { this.defaultPrevented = true; }, ...modifiers };
}

function fixture({ native = false, reduced = false, brokenAnimation = false, blockedNavigation = false } = {}) {
  const handlers = {};
  const animations = [];
  const destinations = [];
  const timers = new Map();
  let timer = 0;
  const motion = { matches: reduced, addEventListener: (name, callback) => { handlers[`motion:${name}`] = callback; } };
  const element = {
    animate() {
      if (brokenAnimation) throw Error('Animation unavailable');
      let finish, reject;
      const animation = {
        cancelled: false,
        finished: new Promise((yes, no) => { finish = yes; reject = no; }),
        finish: () => finish(),
        cancel() { this.cancelled = true; reject(Error('Cancelled')); }
      };
      animations.push(animation);
      return animation;
    }
  };
  const document = {
    documentElement: { dataset: { locale: 'en' } }, head: { append() {} },
    createElement: () => ({ remove() {} }), querySelectorAll: () => [element],
    addEventListener: (name, callback) => { handlers[name] = callback; }
  };
  const window = {
    Element: { prototype: { animate() {} } },
    location: { href: origin, assign: url => { if (blockedNavigation) throw Error('Blocked'); destinations.push(url); } },
    navigation: { addEventListener: (name, callback) => { handlers['navigation:' + name] = callback; } },
    matchMedia: () => motion,
    addEventListener: (name, callback) => { handlers[name] = callback; },
    setTimeout(callback) { timers.set(++timer, callback); return timer; },
    clearTimeout(id) { timers.delete(id); }
  };
  if (native) window.CSSViewTransitionRule = class {};
  initPageTransitions({ document, window });
  return { handlers, animations, destinations, timers, document, motion };
}

test('only ordinary same-origin page links are intercepted', () => {
  assert.equal(navigationTarget(click('/projects/?ref=home'), origin).pathname, '/projects/');
  for (const event of [
    click('https://github.com/jasonwoodland'), click('mailto:me@jasonwoodland.com'), click('#main'),
    click('/download', { download: '' }), click('/projects/', { target: '_blank' }),
    click('/zh/', { 'data-locale-link': 'zh' }),
    ...['metaKey', 'ctrlKey', 'shiftKey', 'altKey', 'defaultPrevented'].map(key => click('/projects/', {}, { [key]: true })),
    click('/projects/', {}, { button: 1 })
  ]) assert.equal(navigationTarget(event, origin), null);
});

test('fallback waits for the fade and preserves the latest destination URL', async () => {
  const value = fixture();
  const first = click('/projects/');
  const leaving = value.handlers.click(first);
  assert.equal(first.defaultPrevented, true);
  assert.deepEqual(value.destinations, []);
  await value.handlers.click(click('/contact/?ref=header'));
  value.document.documentElement.dataset.locale = 'zh';
  value.animations.forEach(animation => animation.finish());
  await leaving;
  assert.deepEqual(value.destinations, [`${origin}contact/?ref=header`]);
  await value.handlers.click(click('/projects/'));
  assert.equal(value.destinations.at(-1), `${origin}projects/`);
  value.handlers.pageshow();
  assert.equal(value.timers.size, 0);
});

test('native transitions and reduced motion retain ordinary navigation', async () => {
  for (const options of [{ native: true }, { reduced: true }]) {
    const value = fixture(options);
    const event = click('/projects/');
    await value.handlers.click(event);
    assert.equal(event.defaultPrevented, undefined);
    assert.equal(value.animations.length, 0);
  }
});

test('restoring a cached page cancels a pending exit without navigating', async () => {
  const value = fixture();
  const leaving = value.handlers.click(click('/projects/'));
  value.handlers.pageshow();
  await leaving;
  assert.deepEqual(value.destinations, []);
});

test('outgoing content stays faded through pagehide until a cached page is restored', async () => {
  const value = fixture();
  const leaving = value.handlers.click(click('/projects/'));
  value.animations.forEach(animation => animation.finish());
  await leaving;
  value.handlers.pagehide();
  assert.ok(value.animations.every(animation => !animation.cancelled));
  assert.equal(value.timers.size, 0, 'no timer can reveal the old page while navigation is pending');
  value.handlers.pageshow();
  assert.ok(value.animations.every(animation => animation.cancelled));
});

test('failed navigation restores visible content and allows another attempt', async () => {
  const value = fixture();
  const leaving = value.handlers.click(click('/projects/'));
  value.animations.forEach(animation => animation.finish());
  await leaving;
  value.handlers['navigation:navigateerror']();
  assert.ok(value.animations.every(animation => animation.cancelled));
  const retry = value.handlers.click(click('/contact/'));
  value.animations.forEach(animation => animation.finish());
  await retry;
  assert.equal(value.destinations.at(-1), origin + 'contact/');
});

test('animation failure never prevents navigation and blocked navigation restores content', async () => {
  const value = fixture({ brokenAnimation: true });
  await value.handlers.click(click('/projects/'));
  assert.equal(value.destinations[0], `${origin}projects/`);
  const blocked = fixture({ blockedNavigation: true });
  const leaving = blocked.handlers.click(click('/projects/'));
  blocked.animations.forEach(animation => animation.finish());
  await leaving;
  assert.ok(blocked.animations.every(animation => animation.cancelled));
});

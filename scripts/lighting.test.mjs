import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('glass rims respond beyond surface-light range and fade on pointer exit', async () => {
  const listeners = new Map();
  const frames = [];
  function surface(left) {
    const properties = new Map();
    return {
      properties, children: [],
      style: { setProperty: (key, value) => properties.set(key, value), removeProperty: key => properties.delete(key) },
      getBoundingClientRect: () => ({ left, top: 0, right: left + 100, bottom: 50, width: 100, height: 50 }),
      addEventListener() {},
      append(child) { this.children.push(child); },
    };
  }
  const near = surface(0);
  const far = surface(250);
  const document = {
    querySelectorAll: () => [near, far],
    createElement: () => ({ setAttribute() {} }),
    addEventListener: (name, handler) => listeners.set(name, handler),
    documentElement: { addEventListener: (name, handler) => listeners.set(name, handler) },
  };
  const source = (await readFile(new URL('../public/assets/site.js', import.meta.url), 'utf8'))
    .replace(/^import .*;$/gm, '').replace(/^init\w+\(\);$/gm, '');
  vm.runInNewContext(source, {
    document,
    window: { matchMedia: () => ({ matches: false, addEventListener() {} }), addEventListener() {} },
    getComputedStyle: () => ({ fontSize: '16px' }),
    requestAnimationFrame: callback => { frames.push(callback); return frames.length; },
    cancelAnimationFrame() {},
  });
  listeners.get('pointermove')({ pointerType: 'mouse', clientX: 50, clientY: 25 });
  frames.shift()();
  assert.equal(near.children[0].className, 'glass-edge');
  assert.equal(near.properties.get('--light-x'), '50px');
  assert.equal(far.properties.get('--light-x'), '-200px');
  assert.equal(far.properties.get('--light-proximity'), '0');
  assert.ok(Number(far.properties.get('--edge-proximity')) > 0);
  assert.ok(Number(near.properties.get('--edge-proximity')) > Number(far.properties.get('--edge-proximity')));
  listeners.get('pointerleave')();
  assert.equal(near.properties.has('--edge-proximity'), false);
  assert.equal(far.properties.has('--edge-proximity'), false);
});

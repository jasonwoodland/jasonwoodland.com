import test from 'node:test';
import assert from 'node:assert/strict';
import { baseURL, checkSite } from './check.mjs';

test('both languages render complete pages, metadata, alternate links and local assets without JavaScript', async () => {
  const result = await checkSite();
  assert.equal(result.pages, 26);
});

test('short paths and previous HTML URLs redirect to the canonical locale path', async () => {
  for (const [path, destination] of [
    ['/projects', '/projects/'], ['/zh', '/zh/'], ['/zh/contact', '/zh/contact/'],
    ['/index.html', '/'], ['/zh/index.html', '/zh/'],
    ['/projects/studyfrog/index.html', '/projects/studyfrog/']
  ]) {
    const response = await fetch(new URL(path, baseURL), { redirect: 'manual' });
    assert.equal(response.status, 308, path);
    assert.equal(response.headers.get('location'), destination, path);
  }
});

test('missing pages keep their locale, return 404 and cannot be indexed', async () => {
  for (const path of ['/missing/', '/zh/missing/', '/404.html']) {
    const response = await fetch(new URL(path, baseURL));
    assert.equal(response.status, 404, path);
    const html = await response.text();
    assert.match(html, /<meta name="robots" content="noindex">/);
    assert.ok(html.includes(path.startsWith('/zh/') ? '这里没有内容' : 'Nothing here'));
    assert.ok(!html.includes('rel="canonical"'));
  }
});

test('private application files and dotfiles are never served', async () => {
  for (const path of ['/app/content.php', '/scripts/router.php', '/.git/config', '/assets/fonts/.hidden']) {
    const response = await fetch(new URL(path, baseURL));
    assert.equal(response.status, 404, path);
    assert.ok(!(await response.text()).includes('<?php'));
  }
});

test('URL language wins over browser preferences and old locale parameters', async () => {
  const response = await fetch(new URL('/?lang=zh', baseURL), { headers: { 'Accept-Language': 'zh-CN' } });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes('<html lang="en-AU"'));
  assert.ok(html.includes('Hi, I’m a software developer from Melbourne.'));
  const chinese = await fetch(new URL('/zh/', baseURL), { headers: { 'Accept-Language': 'en-AU' } });
  assert.equal(chinese.headers.get('content-language'), 'zh-Hans');
});

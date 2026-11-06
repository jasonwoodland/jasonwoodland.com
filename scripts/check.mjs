import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const baseURL = process.env.SITE_URL || 'http://127.0.0.1:8766';

export async function checkSite() {
  const response = await fetch(new URL('/sitemap.xml', baseURL));
  assert.equal(response.status, 200, 'sitemap status');
  const sitemap = await response.text();
  const paths = [...sitemap.matchAll(/<loc>https:\/\/jasonwoodland\.com([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.equal(paths.length, 26, '13 pages in both languages');
  assert.equal(new Set(paths).size, paths.length, 'unique sitemap URLs');

  const documents = new Map(await Promise.all(paths.map(async path => {
    const result = await fetch(new URL(path, baseURL));
    assert.equal(result.status, 200, path);
    assert.equal(result.headers.get('content-language'), path.startsWith('/zh/') ? 'zh-Hans' : 'en-AU');
    return [path, await result.text()];
  })));
  const titles = new Set();
  const assets = new Set();
  let links = 0;
  for (const [path, html] of documents) {
    const chinese = path.startsWith('/zh/');
    const englishPath = chinese ? path.slice(3) : path;
    const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
    assert.ok(title, path + ': title');
    assert.ok(!titles.has(chinese + ':' + title), path + ': unique title');
    titles.add(chinese + ':' + title);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, path + ': one h1');
    assert.match(html, /<meta name="description" content="[^"]+"/, path + ': description');
    assert.ok(html.includes('<link rel="expect" href="#main" blocking="render">'), path + ': content ready before transition');
    assert.ok(html.includes('<html lang="' + (chinese ? 'zh-Hans' : 'en-AU') + '"'), path + ': language');
    assert.ok(html.includes('<link rel="canonical" href="https://jasonwoodland.com' + path + '">'), path + ': canonical');
    assert.ok(html.includes('hreflang="en" href="https://jasonwoodland.com' + englishPath + '"'), path + ': English alternate');
    assert.ok(html.includes('hreflang="zh-Hans" href="https://jasonwoodland.com/zh' + englishPath + '"'), path + ': Chinese alternate');
    assert.ok(!/data-i18n|i18n-en|i18n-zh|data-title-en|data-locale-content/.test(html), path + ': only rendered language');
    const toggle = html.match(/<a class="language-toggle"[^>]*>/)?.[0];
    const alternate = chinese ? englishPath : '/zh' + path;
    assert.ok(toggle?.includes('href="' + alternate + '"'), path + ': working alternate link');
    assert.ok(!toggle.includes('hidden'), path + ': usable without JavaScript');

    for (const image of html.matchAll(/<img\b[^>]*>/g)) assert.match(image[0], /\balt="[^"]*"/, path + ': image description');
    for (const [, raw] of html.matchAll(/(?:href|src)="([^"]*)"/g)) {
      assert.ok(raw, path + ': nonempty link');
      if (/^(https?:|mailto:)/.test(raw)) continue;
      const target = new URL(raw.replaceAll('&amp;', '&'), new URL(path, baseURL));
      if (target.pathname.startsWith('/assets/')) assets.add(target.pathname);
      else {
        assert.ok(documents.has(target.pathname), path + ': valid page ' + raw);
        if (!raw.startsWith('#') && raw !== alternate) {
          assert.equal(target.pathname.startsWith('/zh/'), chinese, path + ': preserves language ' + raw);
        }
        if (target.hash) assert.ok(documents.get(target.pathname).includes('id="' + decodeURIComponent(target.hash.slice(1)) + '"'), path + ': fragment ' + raw);
      }
      links++;
    }
  }
  for (const path of assets) {
    const asset = await fetch(new URL(path, baseURL));
    assert.equal(asset.status, 200, path);
    assert.ok((await asset.arrayBuffer()).byteLength, path + ': nonempty asset');
  }
  assert.ok(documents.get('/').includes('Hi, I’m a software developer from Melbourne.'));
  assert.ok(!documents.get('/').includes('你好，我是一名'));
  assert.ok(documents.get('/zh/').includes('你好，我是一名来自墨尔本的软件开发者。'));
  assert.ok(!documents.get('/zh/').includes('Hi, I’m a software developer'));
  assert.ok(documents.get('/projects/').includes('AI-Powered Language Learning'));
  assert.ok(documents.get('/zh/projects/').includes('AI 驱动的语言学习'));
  return { pages: documents.size, links, assets: assets.size };
}

async function checkSyntax() {
  for (const path of ['public/assets/site.js', 'public/assets/page-init.js', 'public/assets/locale.js', 'public/assets/navigation.js']) {
    const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
    assert.equal(result.status, 0, path + ': ' + result.stderr);
  }
  for (const path of ['app/site.php', 'app/content.php', 'app/translations.php', 'public/index.php', 'scripts/router.php']) {
    const result = spawnSync('docker', ['compose', 'exec', '-T', 'web', 'php', '-l', '/dev/stdin'], {
      input: await readFile(path, 'utf8'), encoding: 'utf8'
    });
    assert.equal(result.status, 0, path + ': ' + result.stderr + result.stdout);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await checkSyntax();
    const result = await checkSite();
    console.log('Checked ' + result.pages + ' server-rendered pages, ' + result.links + ' local links, and ' + result.assets + ' assets. PHP/JavaScript syntax, metadata, language isolation, and alternate links passed.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

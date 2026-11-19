const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const zlib = require('node:zlib');
const { CACHE_NAME, APP_SHELL } = require('../dist/sw.js');
const { registerServiceWorker } = require('../dist/pwa.js');
const dist = path.join(__dirname, '../dist');
const read = name => fs.readFileSync(path.join(dist, name), 'utf8');

test('manifest válido contém identidade, escopo relativo, idioma e cores reais do app', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  for (const [key, value] of Object.entries({ name: 'Lumen', short_name: 'Lumen', start_url: './', scope: './', display: 'standalone', lang: 'pt-BR' })) {
    assert.equal(manifest[key], value);
  }
  const paper = read('style.css').match(/--paper:(#[a-f0-9]{6})/i)[1];
  assert.equal(manifest.theme_color, paper); assert.equal(manifest.background_color, paper);
  const html = read('index.html');
  assert.match(html, /<link rel="manifest" href="manifest.webmanifest">/);
  assert.match(html, /manifest-src 'self'/); assert.match(html, /worker-src 'self'/);
});

test('ícones PNG 192, 512 e maskable existem e contêm pixels nas dimensões declaradas', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.ok(manifest.icons.some(icon => icon.sizes === '192x192' && icon.purpose === 'any'));
  assert.ok(manifest.icons.some(icon => icon.sizes === '512x512' && icon.purpose === 'any'));
  assert.ok(manifest.icons.some(icon => icon.purpose === 'maskable'));
  for (const icon of manifest.icons) {
    const png = fs.readFileSync(path.join(dist, icon.src));
    assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const [width, height] = icon.sizes.split('x').map(Number);
    assert.equal(png.readUInt32BE(16), width); assert.equal(png.readUInt32BE(20), height);
    assert.equal(png[24], 8); assert.equal(png[25], 2);
    const chunks = [];
    for (let offset = 8; offset < png.length;) {
      const length = png.readUInt32BE(offset);
      if (png.toString('ascii', offset + 4, offset + 8) === 'IDAT') chunks.push(png.subarray(offset + 8, offset + 8 + length));
      offset += length + 12;
    }
    assert.equal(zlib.inflateSync(Buffer.concat(chunks)).length, (width * 3 + 1) * height);
  }
});

test('precache versionado referencia arquivos existentes e todos os recursos locais do HTML/manifest', () => {
  assert.equal(CACHE_NAME, 'lumen-v0.4.3');
  assert.match(read('index.html'), /PROTÓTIPO 0\.4\.3/);
  const base = 'https://example.test/lumen/';
  const urls = new Set(APP_SHELL.map(file => new URL(file, base).href));
  assert.equal(urls.size, APP_SHELL.length);
  for (const file of APP_SHELL) {
    const url = new URL(file, base);
    assert.ok(url.href.startsWith(base));
    const relative = url.pathname.slice('/lumen/'.length) || 'index.html';
    assert.ok(fs.statSync(path.join(dist, relative)).isFile(), file);
  }
  assert.ok(urls.has(base)); assert.ok(urls.has(base + 'index.html'));
  for (const [, url] of read('index.html').matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+)"/g)) {
    if (!url.startsWith('data:')) assert.ok(urls.has(new URL(url, base).href), 'Recurso sem precache: ' + url);
  }
  for (const icon of JSON.parse(read('manifest.webmanifest')).icons) assert.ok(urls.has(new URL(icon.src, base).href));
});

test('registro não faz nada sem suporte a serviceWorker ou contexto seguro', async () => {
  for (const nav of [null, {}]) assert.equal(await registerServiceWorker(nav, true), null);
  let calls = 0;
  assert.equal(await registerServiceWorker({ serviceWorker: { register() { calls++; } } }, false), null);
  assert.equal(calls, 0);
});

test('registro usa caminho/escopo relativos; rejeição e erro síncrono são inofensivos', async () => {
  const registration = {};
  const result = await registerServiceWorker({ serviceWorker: { async register(url, options) {
    assert.equal(url, './sw.js'); assert.deepEqual(options, { scope: './' }); return registration;
  } } }, true);
  assert.equal(result, registration);
  for (const register of [() => Promise.reject(new Error('Offline')), () => { throw new Error('SecurityError'); }]) {
    assert.equal(await registerServiceWorker({ serviceWorker: { register } }, true), null);
  }
});

function workerFixture() {
  const events = {}, added = [], deleted = [], fetched = [], opened = [], stored = new Map();
  const base = 'https://example.test/lumen/';
  const offlineResponse = { body: 'cached app shell' }, networkResponse = { body: 'network' };
  let claims = 0;
  const cache = {
    async addAll(files) { added.push(...files); for (const file of files) stored.set(new URL(file, base).href, offlineResponse); },
    async match(request) { return stored.get(request.url); }
  };
  vm.runInNewContext(read('sw.js'), {
    URL,
    self: { registration: { scope: base }, location: new URL(base + 'sw.js'),
      addEventListener(name, handler) { events[name] = handler; },
      clients: { async claim() { claims++; } }
    },
    caches: {
      async open(name) { opened.push(name); return cache; },
      async keys() { return ['lumen-v0.4.1', CACHE_NAME, 'another-app-v1']; },
      async delete(name) { deleted.push(name); return true; }
    },
    async fetch(request) { fetched.push(request.url); return networkResponse; }
  });
  return { base, events, added, deleted, fetched, opened, stored, offlineResponse, networkResponse,
    get claims() { return claims; },
    async lifecycle(name) {
      let work; events[name]({ waitUntil(promise) { work = promise; } });
      assert.ok(work); await work;
    },
    request(url, method = 'GET') {
      let result;
      events.fetch({ request: { url: new URL(url, base).href, method }, respondWith(promise) { result = promise; } });
      return result;
    }
  };
}

test('instalação precacheia a lista; ativação apaga só caches antigos do Lumen', async () => {
  const f = workerFixture();
  await f.lifecycle('install'); assert.deepEqual(f.added, APP_SHELL); assert.deepEqual(f.opened, [CACHE_NAME]);
  await f.lifecycle('activate'); assert.deepEqual(f.deleted, ['lumen-v0.4.1']); assert.equal(f.claims, 1);
});

test('arquivos do shell são servidos do cache, inclusive em subpasta, sem rede', async () => {
  const f = workerFixture(); await f.lifecycle('install');
  for (const file of APP_SHELL) assert.equal(await f.request(file), f.offlineResponse);
  assert.equal(f.fetched.length, 0);
});

test('falta no cache recorre à rede somente para arquivo do shell', async () => {
  const f = workerFixture();
  assert.equal(await f.request('./app.js?v=0.4.3'), f.networkResponse);
  assert.deepEqual(f.fetched, [f.base + 'app.js?v=0.4.3']);
});

test('worker nunca intercepta não-GET, outra origem nem caminhos/versões fora do shell', () => {
  const f = workerFixture();
  for (const method of ['POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']) assert.equal(f.request('./index.html', method), undefined);
  for (const url of ['https://other.test/lumen/index.html', 'http://example.test/lumen/index.html', '/other/index.html', './api', './app.js?v=old']) {
    assert.equal(f.request(url), undefined);
  }
  assert.equal(f.opened.length, 0); assert.equal(f.fetched.length, 0);
});

test('assetlinks provisorio existe na raiz do site com pacote e SHA placeholder', () => {
  const file = path.join(__dirname, '../dist/.well-known/assetlinks.json');
  assert.ok(fs.existsSync(file), 'falta dist/.well-known/assetlinks.json');
  assert.ok(fs.existsSync(path.join(__dirname, '../dist/.nojekyll')), 'falta dist/.nojekyll');
  const entries = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(entries[0].target.package_name, 'com.hiagomrossi.lumen');
  assert.deepEqual(entries[0].target.sha256_cert_fingerprints, ['REPLACE_WITH_PLAY_APP_SIGNING_SHA256']);
  assert.ok(!APP_SHELL.some(u => u.includes('assetlinks') || u.includes('.well-known')),
    'assetlinks nao deve entrar no cache do app shell');
});

test('TWA aponta para hiagomrossi.github.io', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../android-twa/twa-manifest.json'), 'utf8'));
  assert.equal(manifest.host, 'hiagomrossi.github.io');
  assert.equal(manifest.packageId, 'com.hiagomrossi.lumen');
  assert.equal(manifest.startUrl, '/');
  assert.match(manifest.webManifestUrl, /^https:\/\/hiagomrossi\.github\.io\//);
});

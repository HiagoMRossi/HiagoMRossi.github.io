const test = require('node:test');
const assert = require('node:assert/strict');
const { ScreenWakeLock } = require('../dist/wake-lock.js');
const { PrayerEngine } = require('../dist/core.js');
const tick = () => new Promise(resolve => setImmediate(resolve));

function sentinel() {
  const lock = new EventTarget();
  lock.released = false; lock.releases = 0;
  lock.release = async () => {
    lock.releases++; lock.released = true; lock.dispatchEvent(new Event('release'));
  };
  return lock;
}
function fixture(request) {
  const document = new EventTarget(); document.hidden = false;
  const requests = [], locks = [];
  const wake = new ScreenWakeLock({ document, navigator: { wakeLock: { request(type) {
    requests.push(type);
    if (request) return request();
    const lock = sentinel(); locks.push(lock); return Promise.resolve(lock);
  } } } });
  return { wake, requests, locks, document,
    visibility(hidden) { document.hidden = hidden; document.dispatchEvent(new Event('visibilitychange')); }
  };
}

test('sessão real adquire ao iniciar, mantém entre frases e libera ao pausar, concluir e reiniciar', async () => {
  const f = fixture();
  const engine = new PrayerEngine({
    speak() {}, stop() {}, led() {}, finish() {}, error() {},
    change: state => f.wake.setActive(state.playing && !state.finished)
  }, 'gozosos');
  assert.equal(f.requests.length, 0);
  engine.start(); await tick();
  assert.deepEqual(f.requests, ['screen']);
  engine.done(engine.activeId); await tick();
  assert.equal(f.requests.length, 1);
  engine.pause(); await tick(); assert.equal(f.locks[0].releases, 1);
  engine.start(); await tick(); assert.equal(f.requests.length, 2);
  engine.move(engine.steps.length); await tick();
  assert.equal(engine.finished, true); assert.equal(f.locks[1].releases, 1);
  engine.start(); await tick(); engine.reset(); await tick();
  assert.equal(f.locks[2].releases, 1);
});

test('visibilidade readquire somente se a sessão ainda está ativa', async () => {
  const f = fixture();
  await f.wake.setActive(true);
  f.visibility(true); await tick(); assert.equal(f.locks[0].releases, 1);
  f.visibility(false); await tick(); assert.equal(f.requests.length, 2);
  f.visibility(false); await tick(); assert.equal(f.requests.length, 2);
  await f.wake.setActive(false);
  f.visibility(true); f.visibility(false); await tick();
  assert.equal(f.requests.length, 2);
});

test('liberação pelo sistema permite nova aquisição ao tornar a página visível', async () => {
  const f = fixture();
  await f.wake.setActive(true);
  await f.locks[0].release();
  f.visibility(false); await tick(); assert.equal(f.requests.length, 2);
});

test('sessão iniciada oculta aguarda a página ficar visível', async () => {
  const f = fixture(); f.visibility(true);
  await f.wake.setActive(true); assert.equal(f.requests.length, 0);
  f.visibility(false); await tick(); assert.equal(f.requests.length, 1);
  await f.wake.setActive(false);
});

test('API ausente não interfere na sessão', async () => {
  for (const navigator of [null, {}, { wakeLock: {} }]) {
    const document = new EventTarget(); document.hidden = false;
    const wake = new ScreenWakeLock({ navigator, document });
    assert.equal(await wake.setActive(true), null);
    await wake.setActive(false); await wake.destroy();
  }
});

test('rejeição e erro síncrono são tratados; visibilidade permite tentar novamente', async () => {
  for (const fail of [() => Promise.reject(new Error('NotAllowedError')), () => { throw new Error('SecurityError'); }]) {
    let denied = true;
    const f = fixture(() => denied ? fail() : Promise.resolve(sentinel()));
    assert.equal(await f.wake.setActive(true), null);
    await f.wake.setActive(true); assert.equal(f.requests.length, 1);
    denied = false; f.visibility(false); await tick();
    assert.equal(f.requests.length, 2); assert.ok(f.wake.sentinel);
    await f.wake.setActive(false);
  }
});

test('pausar enquanto o pedido está pendente libera a resposta atrasada', async () => {
  let resolve;
  const f = fixture(() => new Promise(done => { resolve = done; }));
  const pending = f.wake.setActive(true); await tick();
  await f.wake.setActive(false);
  const lock = sentinel(); resolve(lock);
  assert.equal(await pending, null);
  assert.equal(lock.releases, 1); assert.equal(f.wake.sentinel, null);
});

test('pausa e retomada rápidas não duplicam pedidos nem deixam a resposta antiga substituir a nova', async () => {
  const resolves = [];
  const f = fixture(() => new Promise(resolve => resolves.push(resolve)));
  const old = f.wake.setActive(true);
  f.wake.setActive(true); f.visibility(false); await tick();
  assert.equal(f.requests.length, 1);
  await f.wake.setActive(false);
  const current = f.wake.setActive(true); await tick();
  assert.equal(f.requests.length, 2);
  const newLock = sentinel(); resolves[1](newLock); await current;
  const oldLock = sentinel(); resolves[0](oldLock); await old;
  assert.equal(oldLock.releases, 1); assert.equal(newLock.releases, 0);
  assert.equal(f.wake.sentinel, newLock);
  await f.wake.setActive(false); assert.equal(newLock.releases, 1);
});

test('pedido concluído após ocultar a página é liberado; falha ao liberar é inofensiva', async () => {
  let resolve;
  const f = fixture(() => new Promise(done => { resolve = done; }));
  const pending = f.wake.setActive(true); await tick(); f.visibility(true);
  const lock = sentinel(); resolve(lock); await pending;
  assert.equal(lock.releases, 1);
  const deniedRelease = fixture(() => Promise.resolve(Object.assign(sentinel(), {
    release: () => Promise.reject(new Error('Already released'))
  })));
  await deniedRelease.wake.setActive(true);
  await assert.doesNotReject(deniedRelease.wake.setActive(false));
});

test('destroy libera a tela e remove o observador de visibilidade', async () => {
  const f = fixture(); await f.wake.setActive(true); await f.wake.destroy();
  f.visibility(true); f.visibility(false); await tick();
  assert.equal(f.locks[0].releases, 1); assert.equal(f.requests.length, 1);
});

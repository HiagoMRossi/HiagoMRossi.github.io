const test = require('node:test');
const assert = require('node:assert/strict');
const { GuidedLights } = require('../dist/guided-lights.js');
const { PrayerEngine } = require('../dist/core.js');
const tick = () => new Promise(resolve => setImmediate(resolve));

function fixture(writer) {
  const writes = [], timers = new Map();
  let id = 0, connected = true, enabled = true, busy = false;
  const lights = new GuidedLights({
    available: () => connected && enabled,
    write: async rgb => {
      if (!connected) return false;
      writes.push(rgb);
      if (writer) await writer(rgb);
      return true;
    },
    onBusy: value => { busy = value; },
    setTimer: callback => { timers.set(++id, callback); return id; },
    clearTimer: timer => timers.delete(timer)
  });
  async function drain() {
    for (let n = 0; n < 100; n++) {
      await tick();
      if (!timers.size) return;
      const [timer, callback] = timers.entries().next().value;
      timers.delete(timer); callback();
    }
    throw new Error('Efeito não terminou.');
  }
  return { lights, writes, timers, drain, get busy() { return busy; },
    disconnect() { connected = false; lights.sync({ playing: false }); },
    disable() { enabled = false; lights.sync({ playing: false }); }
  };
}

test('terço completo: 53 pulsações por Ave-Maria concluída e três no encerramento', async () => {
  const f = fixture();
  const e = new PrayerEngine({
    speak() {}, stop() {}, led() {}, error(message) { throw new Error(message); },
    change: state => f.lights.sync(state),
    completed: state => f.lights.completed(state.step),
    finish: () => f.lights.pulse(3, true)
  }, 'gloriosos');
  e.start();
  let count = 0;
  while (!e.finished) {
    assert.ok(count++ < 1000);
    e.done(e.activeId);
    await f.drain();
  }
  assert.equal(f.writes.filter(rgb => rgb[0] === 32).length, 56);
  assert.deepEqual(f.writes[0], [6, 4, 2]);
  assert.deepEqual(f.writes.at(-1), [0, 0, 0]);
  assert.ok(f.writes.every(rgb => rgb.length === 3 && rgb.every(x => Number.isInteger(x) && x >= 0 && x <= 32)));
  assert.equal(f.busy, false); assert.equal(f.timers.size, 0);
});

test('frases parciais, callback repetido, pausa e avanço manual não contam como Ave-Maria concluída', async () => {
  const f = fixture();
  const e = new PrayerEngine({
    speak() {}, stop() {}, led() {}, finish() {}, error() {},
    change: state => f.lights.sync(state),
    completed: state => f.lights.completed(state.step)
  }, 'gozosos', 3);
  e.start();
  const first = e.activeId;
  e.done(first); e.done(first);
  await f.drain(); assert.equal(f.writes.length, 1);
  const interrupted = e.activeId;
  e.pause(); e.done(interrupted); await f.drain();
  assert.deepEqual(f.writes.at(-1), [0, 0, 0]);
  e.start(); e.move(1); await f.drain();
  assert.equal(f.writes.some(rgb => rgb[0] === 32), false);
  e.pause();
});

test('pausar durante uma pulsação cancela timers e deixa preto como último envio', async () => {
  const f = fixture();
  f.lights.sync({ playing: true });
  const pulse = f.lights.completed({ kind: 'ave' });
  await tick(); assert.equal(f.timers.size, 1);
  f.lights.sync({ playing: false });
  await f.drain(); await pulse;
  assert.equal(f.busy, false); assert.equal(f.timers.size, 0);
  assert.deepEqual(f.writes.at(-1), [0, 0, 0]);
});

test('resposta atrasada de escrita cancelada não reinicia a animação', async () => {
  const releases = [];
  const f = fixture(() => new Promise(resolve => releases.push(resolve)));
  const pulse = f.lights.pulse();
  const off = f.lights.stop();
  releases.splice(0).forEach(resolve => resolve());
  await pulse; await off; await f.drain();
  assert.equal(f.writes.length, 2); assert.equal(f.timers.size, 0);
  assert.deepEqual(f.writes.at(-1), [0, 0, 0]);
});

test('desativar acompanhamento apaga; queda do Bluetooth cancela sem repetir comandos', async () => {
  for (const reason of ['disable', 'disconnect']) {
    const f = fixture();
    const pulse = f.lights.pulse(3);
    await tick();
    f[reason](); const count = f.writes.length;
    await f.drain(); await pulse;
    assert.equal(f.writes.length, count); assert.equal(f.busy, false);
    assert.equal(f.timers.size, 0);
    if (reason === 'disable') assert.deepEqual(f.writes.at(-1), [0, 0, 0]);
  }
});

test('teste de pulsação termina apagado e não inicia a narração nem o modo contínuo', async () => {
  const f = fixture();
  const pulse = f.lights.pulse(); await f.drain(); assert.equal(await pulse, true);
  assert.equal(f.writes.filter(rgb => rgb[0] === 32).length, 1);
  assert.deepEqual(f.writes.at(-1), [0, 0, 0]);
  assert.equal(f.lights.playing, false);
  const count = f.writes.length;
  await f.lights.stop(); assert.equal(f.writes.length, count);
});

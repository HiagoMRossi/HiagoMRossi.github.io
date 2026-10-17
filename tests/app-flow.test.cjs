const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const tick = () => new Promise(resolve => setImmediate(resolve));

// DOM mínimo para exercitar cliques e callbacks reais do app; não verifica layout.
function fixture(options = {}) {
  const html = fs.readFileSync(path.join(__dirname, '../dist/index.html'), 'utf8');
  function element() {
    const handlers = {};
    return { value: '', textContent: '', style: {}, dataset: {}, disabled: false, checked: false,
      classList: { toggle() {}, remove() {} }, setAttribute() {}, append() {},
      addEventListener(type, handler) { handlers[type] = handler; },
      showModal() { this.open = true; },
      close() { this.open = false; queueMicrotask(() => handlers.close?.()); }
    };
  }
  const elements = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m => [m[1], element()]));
  const $ = id => { assert.ok(elements[id], 'Elemento ausente: ' + id); return elements[id]; };
  $('light-profile').value = options.restoredProfile || html.match(/<option value="([^"]+)" selected>/)[1];
  $('test-bead').value = '1'; $('guide-enabled').checked = true;
  const actions = [...html.matchAll(/data-sp-action="([^"]+)"/g)].map(m => Object.assign(element(), { dataset: { spAction: m[1] } }));
  const writes = [], writeModes = [], spoken = [], events = {}, requests = [], services = [], characteristics = [];
  const characteristic = {
    properties: options.properties || { write: true, writeWithoutResponse: true },
    async writeValueWithResponse(bytes) { writes.push(Array.from(bytes)); writeModes.push('withResponse'); },
    async writeValueWithoutResponse(bytes) { writes.push(Array.from(bytes)); writeModes.push('withoutResponse'); }
  };
  const device = new EventTarget();
  device.gatt = {
    connected: false,
    async connect() { this.connected = true; return this; },
    disconnect() { this.connected = false; device.dispatchEvent(new Event('gattserverdisconnected')); },
    async getPrimaryService(uuid) {
      services.push(uuid);
      return { async getCharacteristic(uuid) { characteristics.push(uuid); return characteristic; } };
    }
  };
  const document = {
    hidden: false, getElementById: $, createElement: element, createElementNS: element,
    querySelector: () => element(), querySelectorAll: () => actions,
    addEventListener: (name, handler) => { events[name] = handler; }
  };
  const context = vm.createContext({ document, navigator: { bluetooth: { async requestDevice(query) { requests.push(JSON.parse(JSON.stringify(query))); return device; } } },
    isSecureContext: true, setTimeout, clearTimeout, performance,
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    localStorage: { getItem: () => JSON.stringify({ group: 'gozosos', index: 3 }), setItem() {} },
    speechSynthesis: { getVoices: () => [], speak: utterance => spoken.push(utterance), cancel() {} },
    SpeechSynthesisUtterance: function (text) { this.text = text; },
    addEventListener() {}, confirm: () => true
  });
  context.window = context;
  for (const name of ['core.js', 'bluetooth.js', 'guided-lights.js', 'app.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../dist', name), 'utf8'), context, { filename: name });
  }
  return { $, writes, writeModes, spoken, document, events, requests, services, characteristics, device };
}

test('SP105E continua disponível por seleção explícita; rezar inicia voz/luzes e pausar/ocultar apagam', async () => {
  const f = fixture();
  f.$('connect').onclick();
  f.$('light-profile').value = 'sp105e'; f.$('light-profile').onchange();
  f.$('pair').onclick(); await tick();
  assert.equal(f.writes.length, 0);
  assert.equal(f.$('sp-start').disabled, false);
  f.$('sp-start').onclick(); await tick();
  assert.equal(f.$('lights').open, false);
  assert.equal(f.$('play-label').textContent, 'Pausar');
  assert.equal(f.spoken.length, 1);
  assert.deepEqual(f.writes.at(-1), [0x38, 6, 4, 2, 0x1e]);
  // Concluir a Ave-Maria ativa o efeito; pausar cancela antes do próximo quadro.
  while (f.$('bead-label').textContent === 'Conta 2 de 59') f.spoken.at(-1).onend();
  await tick();
  f.$('play').onclick(); await tick();
  assert.deepEqual(f.writes.at(-1), [0x38, 0, 0, 0, 0x1e]);
  assert.equal(f.$('play-label').textContent, 'Continuar oração');
  f.$('play').onclick(); await tick();
  assert.deepEqual(f.writes.at(-1), [0x38, 6, 4, 2, 0x1e]);
  f.document.hidden = true; f.events.visibilitychange(); await tick();
  assert.equal(f.$('play-label').textContent, 'Continuar oração');
  assert.deepEqual(f.writes.at(-1), [0x38, 0, 0, 0, 0x1e]);
  assert.ok(f.writes.every(bytes => bytes.length === 5 && bytes[4] === 0x1e));
});

test('entrada principal usa TercoBLE mesmo após seleção antiga restaurada e testa acender/apagar com resposta', async () => {
  const f = fixture({ restoredProfile: 'sp105e', properties: { write: true } });
  assert.equal(f.requests.length, 0);
  f.$('connect').onclick();
  assert.equal(f.$('light-profile').value, 'terco');
  assert.equal(f.$('selected-controller').textContent, 'STM32 · TercoBLE');
  assert.equal(f.$('pair').textContent, 'Conectar STM32');
  assert.equal(f.$('pair-all').hidden, true);
  f.$('pair').onclick(); await tick();
  assert.equal(f.device.gatt.connected, true);
  assert.deepEqual(f.requests[0].optionalServices, ['8ec90001-f315-4f60-9fb8-838830daea50']);
  assert.deepEqual(f.services, ['8ec90001-f315-4f60-9fb8-838830daea50']);
  assert.deepEqual(f.characteristics, ['8ec90002-f315-4f60-9fb8-838830daea50']);
  f.$('test-on').onclick(); await tick();
  assert.deepEqual(f.writes.at(-1), [1, 1, 0, 32, 255, 180, 82, 0]);
  f.$('test-off').onclick(); await tick();
  assert.deepEqual(f.writes.at(-1), [1, 0, 255, 32, 255, 180, 82, 0]);
  assert.ok(f.writes.every(bytes => bytes.length === 8));
  assert.ok(f.writeModes.every(mode => mode === 'withResponse'));
  f.$('pair').onclick(); await tick();
  assert.equal(f.device.gatt.connected, false);
  assert.equal(f.$('connect').textContent, 'Conectar STM32');
});

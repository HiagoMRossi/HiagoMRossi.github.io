const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const tick = () => new Promise(resolve => setImmediate(resolve));

// DOM mínimo para exercitar cliques e callbacks reais do app; não verifica layout.
function fixture() {
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
  $('light-profile').value = 'sp105e'; $('test-bead').value = '1'; $('guide-enabled').checked = true;
  const actions = [...html.matchAll(/data-sp-action="([^"]+)"/g)].map(m => Object.assign(element(), { dataset: { spAction: m[1] } }));
  const writes = [], spoken = [], events = {};
  const characteristic = { properties: { writeWithoutResponse: true }, async writeValueWithoutResponse(bytes) { writes.push(Array.from(bytes)); } };
  const device = new EventTarget();
  device.gatt = {
    connected: false,
    async connect() { this.connected = true; return this; },
    disconnect() { this.connected = false; device.dispatchEvent(new Event('gattserverdisconnected')); },
    async getPrimaryService() { return { async getCharacteristic() { return characteristic; } }; }
  };
  const document = {
    hidden: false, getElementById: $, createElement: element, createElementNS: element,
    querySelector: () => element(), querySelectorAll: () => actions,
    addEventListener: (name, handler) => { events[name] = handler; }
  };
  const context = vm.createContext({ document, navigator: { bluetooth: { async requestDevice() { return device; } } },
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
  return { $, writes, spoken, document, events };
}

test('fluxo real do app: conectar não escreve; botão de rezar inicia voz/luzes; pausar e ocultar apagam', async () => {
  const f = fixture();
  f.$('connect').onclick(); f.$('pair').onclick(); await tick();
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

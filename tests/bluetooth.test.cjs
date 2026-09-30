const test = require('node:test');
const assert = require('node:assert/strict');
const { WebBle, packet, sp105ePacket, profiles, availability } = require('../dist/bluetooth.js');
const { PrayerEngine } = require('../dist/core.js');
const tick = () => new Promise(resolve => setImmediate(resolve));

function fixture(options = {}) {
  const statuses = [], writes = [], sent = [], requests = [];
  const device = new EventTarget();
  device.name = 'TercoBLE';
  let inFlight = 0, maxInFlight = 0;
  async function write(bytes, response) {
    const copy = Array.from(bytes);
    writes.push({ bytes: copy, response }); inFlight++; maxInFlight = Math.max(maxInFlight, inFlight);
    try { if (options.writer) await options.writer(copy); }
    finally { inFlight--; }
  }
  const characteristic = {
    properties: options.properties || { write: true, writeWithoutResponse: true },
    writeValueWithResponse: data => write(data, true),
    writeValueWithoutResponse: data => write(data, false)
  };
  device.gatt = {
    connected: false,
    async connect() { this.connected = true; return this; },
    disconnect() { this.connected = false; device.dispatchEvent(new Event('gattserverdisconnected')); },
    async getPrimaryService(id) {
      if (options.serviceError) throw options.serviceError;
      assert.ok(Object.values(profiles).some(p => p.service === id));
      return { async getCharacteristic(charId) { assert.ok(Object.values(profiles).some(p => p.characteristic === charId)); return characteristic; } };
    }
  };
  const nav = { bluetooth: { requestDevice(query) { requests.push(query); return options.selection ? options.selection() : Promise.resolve(device); } } };
  const ble = new WebBle({ navigator: nav, secure: options.secure !== false, timeout: options.timeout || 500, onStatus: x => statuses.push(x), onWrite: x => sent.push(x) });
  return { ble, device, statuses, writes, sent, requests, get maxInFlight() { return maxInFlight; } };
}

test('pacote de 8 bytes respeita índices e brilho, com OFF sem índice', () => {
  assert.deepEqual(Array.from(packet(1, 11, 32)), [1, 1, 11, 32, 255, 180, 82, 0]);
  assert.equal(packet(1, 58, 64)[2], 58);
  assert.equal(packet(0, 11, 1)[2], 255);
  assert.equal(packet(2, null, 32)[2], 255);
  for (const args of [[1, -1, 32], [1, 59, 32], [1, 2.5, 32], [1, 1, 255], [1, 1, 0], [3, 1, 32]]) assert.throws(() => packet(...args));
});
test('contexto inseguro não abre seletor nem anuncia conexão fictícia', async () => {
  const f = fixture({ secure: false }); assert.equal(await f.ble.connect(), false);
  assert.equal(f.requests.length, 0); assert.equal(f.ble.connected, false);
  assert.match(f.statuses.at(-1).message, /HTTPS/);
  assert.match(availability({}, true), /não oferece/);
});
test('conecta por clique, descobre serviço correto e escreve a conta com resposta', async () => {
  const f = fixture(); assert.equal(await f.ble.connect(), true);
  assert.equal(f.requests[0].optionalServices[0], profiles.terco.service);
  assert.equal(await f.ble.command(1, 58, 10), true);
  assert.deepEqual(f.writes.at(-1), { bytes: [1, 1, 58, 10, 255, 180, 82, 0], response: true });
  assert.equal(f.sent.length, 1); await f.ble.disconnect();
});
test('teste NUCLEO usa protocolo ST e nunca recebe pacotes de 59 contas', async () => {
  const f = fixture(); await f.ble.connect('nucleo');
  assert.ok(f.requests[0].filters.some(x => x.namePrefix === 'p2pS'));
  assert.equal(await f.ble.command(1, 0, 32), false);
  assert.equal(await f.ble.board(true), true); assert.equal(await f.ble.board(false), true);
  assert.deepEqual(f.writes.map(x => x.bytes), [[1, 1], [1, 0]]);
  assert.ok(f.writes.every(x => !x.response)); await f.ble.disconnect();
});
test('SP105E conecta sem mutação automática e envia somente seus comandos de 5 bytes', async () => {
  const f = fixture({ properties: { write: false, writeWithoutResponse: true } });
  assert.equal(await f.ble.connect('sp105e'), true);
  assert.equal(f.requests[0].optionalServices[0], '0000ffe0-0000-1000-8000-00805f9b34fb');
  assert.ok(f.requests[0].filters.some(x => x.namePrefix === 'SP105E'));
  assert.equal(f.writes.length, 0);
  assert.equal(await f.ble.command(1, 0, 32), false);
  assert.equal(await f.ble.board(true), false);
  for (const action of ['red', 'green', 'blue', 'gold', 'black', 'toggle']) assert.equal(await f.ble.sp105e(action), true);
  assert.deepEqual(f.writes.map(x => x.bytes), [
    [0x38,32,0,0,0x1e], [0x38,0,32,0,0x1e], [0x38,0,0,32,0x1e],
    [0x38,32,22,10,0x1e], [0x38,0,0,0,0x1e], [0x38,0,0,0,0xaa]
  ]);
  assert.ok(f.writes.every(x => !x.response));
  await f.ble.disconnect();
  assert.deepEqual(f.writes.at(-1).bytes, [0x38,0,0,0,0x1e]);
  assert.equal(f.writes.filter(x => x.bytes[4] === 0xaa).length, 1);
});
test('SP105E rejeita toggle concorrente e desconecta com preto após envio pendente', async () => {
  const releases = []; const f = fixture({ writer: () => new Promise(r => releases.push(r)) });
  await f.ble.connect('sp105e');
  const toggle = f.ble.sp105e('toggle');
  assert.equal(await f.ble.sp105e('toggle'), false);
  const closing = f.ble.disconnect();
  assert.equal(await f.ble.sp105e('red'), false);
  releases.shift()(); await tick();
  assert.deepEqual(f.writes.map(x => x.bytes[4]), [0xaa, 0x1e]);
  releases.shift()(); await toggle; await closing;
  assert.equal(f.maxInFlight, 1); assert.equal(f.ble.connected, false);
});
test('comandos SP105E não vazam para outros perfis e não aceitam parâmetros arbitrários', async () => {
  for (const profile of ['terco', 'nucleo']) {
    const f = fixture(); await f.ble.connect(profile);
    assert.equal(await f.ble.sp105e('toggle'), false); assert.equal(f.writes.length, 0); f.ble.cleanup();
  }
  for (const action of ['pixels', '__proto__', 'constructor', '', null, 0]) assert.throws(() => sp105ePacket(action));
});
test('cancelar seleção mantém modo sem conexão', async () => {
  const error = new Error('Cancelado'); error.name = 'NotFoundError';
  const f = fixture({ selection: () => Promise.reject(error) });
  assert.equal(await f.ble.connect(), false); assert.equal(f.statuses.at(-1).state, 'disconnected');
  assert.equal(await f.ble.command(1, 0, 32), false);
});
test('busca sem filtro encontra dispositivo renomeado sem ampliar os serviços permitidos', async () => {
  const f = fixture(); f.device.name = '1';
  assert.equal(await f.ble.connect('sp105e', { acceptAllDevices: true }), true);
  assert.deepEqual(f.requests[0], {
    acceptAllDevices: true,
    optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb']
  });
  assert.equal(f.writes.length, 0); f.ble.cleanup();
  assert.equal(await f.ble.connect('terco', { acceptAllDevices: true }), false);
  assert.equal(f.requests.length, 1);
});
test('busca ampla não habilita comandos em dispositivo sem o serviço do controlador', async () => {
  const serviceError = new Error('No Services matching UUID found'); serviceError.name = 'NotFoundError';
  const f = fixture({ serviceError });
  assert.equal(await f.ble.connect('sp105e', { acceptAllDevices: true }), false);
  assert.equal(f.device.gatt.connected, false);
  assert.equal(await f.ble.sp105e('red'), false); assert.equal(f.writes.length, 0);
  assert.equal(f.statuses.at(-1).state, 'error');
  assert.match(f.statuses.at(-1).diagnostic, /Etapa: service/);
  assert.doesNotMatch(f.statuses.at(-1).message, /sem selecionar/);
});
test('rejeição na seleção preserva o erro do Chrome e diferencia permissão de seleção vazia', async () => {
  for (const name of ['NotFoundError', 'NotAllowedError', 'SecurityError']) {
    const error = new Error('Original browser detail'); error.name = name;
    const f = fixture({ selection: () => Promise.reject(error) });
    assert.equal(await f.ble.connect('sp105e'), false);
    assert.equal(f.statuses.at(-1).state, name === 'NotFoundError' ? 'disconnected' : 'error');
    assert.match(f.statuses.at(-1).diagnostic, /Etapa: selection/);
    assert.match(f.statuses.at(-1).diagnostic, /Original browser detail/);
    assert.match(f.statuses.at(-1).message, name === 'NotFoundError' ? /Buscar sem filtro/ : /bloqueado/);
    assert.equal(f.writes.length, 0);
  }
});
test('serviço incompatível fecha a conexão antes de enviar qualquer comando', async () => {
  const f = fixture({ properties: { write: false, writeWithoutResponse: true } });
  assert.equal(await f.ble.connect('terco'), false);
  assert.equal(f.device.gatt.connected, false); assert.equal(f.writes.length, 0);
  assert.equal(f.statuses.at(-1).state, 'error');
});
test('fila serial preserva o último estado e nunca sobrepõe escritas', async () => {
  const releases = []; const f = fixture({ writer: () => new Promise(r => releases.push(r)) });
  await f.ble.connect();
  const first = f.ble.command(1, 0, 32), middle = f.ble.command(1, 1, 32), last = f.ble.command(1, 58, 32);
  assert.equal(await middle, false);
  assert.equal(f.writes.length, 1); releases.shift()(); await tick();
  assert.equal(f.writes.length, 2); assert.equal(f.writes[1].bytes[2], 58);
  releases.shift()(); assert.equal(await first, true); assert.equal(await last, true);
  assert.equal(f.maxInFlight, 1); f.ble.cleanup();
});
test('desconectar envia OFF depois da escrita atual, descartando estados pendentes', async () => {
  const releases = []; const f = fixture({ writer: () => new Promise(r => releases.push(r)) });
  await f.ble.connect();
  const first = f.ble.command(1, 4, 32), pending = f.ble.command(1, 5, 32);
  const stop = f.ble.disconnect(); assert.equal(await pending, false);
  releases.shift()(); await tick();
  assert.equal(f.writes.at(-1).bytes[1], 0);
  releases.shift()(); await first; await stop;
  assert.equal(f.device.gatt.connected, false); assert.equal(f.statuses.at(-1).state, 'disconnected');
});
test('queda da conexão invalida resposta atrasada e não acende a próxima conta', async () => {
  let release; const f = fixture({ writer: () => new Promise(r => { release = r; }) });
  await f.ble.connect(); const old = f.ble.command(1, 4, 32), pending = f.ble.command(1, 5, 32);
  f.device.gatt.disconnect(); assert.equal(await pending, false);
  release(); assert.equal(await old, false);
  assert.equal(f.sent.length, 0); assert.equal(f.writes.length, 1); assert.equal(f.ble.connected, false);
});
test('timeout fecha a conexão e resolve a fila sem prometer envio', async () => {
  const f = fixture({ writer: () => new Promise(() => {}), timeout: 15 }); await f.ble.connect();
  assert.equal(await f.ble.command(1, 1, 32), false);
  assert.equal(f.ble.connected, false); assert.equal(f.device.gatt.connected, false); assert.equal(f.sent.length, 0);
  assert.equal(f.statuses.at(-1).state, 'error');
});
test('fim de cada fala produz a sequência completa de 59 contas e o efeito final', async () => {
  const f = fixture(); await f.ble.connect(); let lastWrite = Promise.resolve();
  const engine = new PrayerEngine({
    speak() {}, stop() {}, change() {}, error(message) { throw new Error(message); },
    led(bead) { lastWrite = f.ble.command(bead === null ? 0 : 1, bead, 32); },
    finish() { lastWrite = f.ble.command(2, null, 32); }
  }, 'gloriosos');
  engine.start(); await lastWrite;
  let count = 0;
  while (!engine.finished) { assert.ok(count++ < 1500); engine.done(engine.activeId); await lastWrite; }
  const uniqueBeads = [...new Set(f.writes.filter(x => x.bytes[1] === 1).map(x => x.bytes[2]))];
  assert.deepEqual(uniqueBeads, Array.from({ length: 59 }, (_, i) => i));
  assert.equal(f.writes.at(-1).bytes[1], 2); await f.ble.disconnect();
});

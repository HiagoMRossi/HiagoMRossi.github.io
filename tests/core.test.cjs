const test = require('node:test');
const assert = require('node:assert/strict');
const { sequence, mysteries, PrayerEngine } = require('../dist/core.js');

function harness(group = 'gloriosos', index = 0) {
  const spoken = [], leds = [], errors = []; let finishes = 0;
  const e = new PrayerEngine({
    speak(text, id) { spoken.push({ text, id }); },
    stop() {}, led(bead) { leds.push(bead); }, change() {},
    finish() { finishes++; }, error(message) { errors.push(message); }
  }, group, index);
  return { e, spoken, leds, errors, get finishes() { return finishes; } };
}

for (const group of Object.keys(mysteries)) {
  test(`${group}: 53 Ave-Marias, 6 Pais-nossos e todas as 59 contas na ordem`, () => {
    const s = sequence(group);
    assert.equal(s.length, 79);
    assert.equal(s.filter(x => x.kind === 'ave').length, 53);
    assert.equal(s.filter(x => x.kind === 'pai').length, 6);
    const beadPrayers = s.filter(x => ['ave', 'pai'].includes(x.kind));
    assert.deepEqual(beadPrayers.map(x => x.bead), Array.from({ length: 59 }, (_, i) => i));
    for (let d = 1; d <= 5; d++) {
      assert.equal(s.filter(x => x.decade === d && x.kind === 'ave').length, 10);
      const last = s.find(x => x.decade === d && x.kind === 'ave' && x.count === 10);
      for (const x of s.filter(x => x.decade === d && ['gloria', 'fatima'].includes(x.kind))) assert.equal(x.bead, last.bead);
    }
    assert.equal(s.at(-1).kind, 'sinal');
    assert.equal(s.at(-2).kind, 'salve');
  });
}
test('narração inteira termina uma única vez, sem usar relógio para avançar', () => {
  const h = harness(); h.e.start(); let callbacks = 0;
  while (!h.e.finished) { assert.ok(callbacks++ < 2000); h.e.done(h.e.activeId); }
  assert.ok(callbacks > 79);
  assert.equal(h.e.playing, false);
  assert.equal(h.finishes, 1);
  h.e.done(h.spoken.at(-1).id);
  assert.equal(h.finishes, 1);
  assert.ok(h.leds.every(x => x === null || x >= 0 && x < 59));
});
test('pausa invalida callback atrasado e retoma a frase interrompida', () => {
  const h = harness(); h.e.start(); const first = h.spoken.at(-1);
  h.e.pause(); h.e.done(first.id);
  assert.equal(h.e.index, 0); assert.equal(h.e.phrase, 0);
  h.e.start(); const repeat = h.spoken.at(-1);
  assert.equal(repeat.text, first.text); assert.notEqual(repeat.id, first.id);
  h.e.done(first.id); assert.equal(h.e.phrase, 0);
  h.e.done(repeat.id); assert.equal(h.e.phrase, 1);
  h.e.done(repeat.id); assert.equal(h.e.phrase, 1);
});
test('navegação manual cancela a fala anterior e não pula a próxima oração', () => {
  const h = harness(); h.e.start(); const stale = h.e.activeId;
  h.e.move(1); assert.equal(h.e.index, 1); assert.equal(h.e.playing, true);
  h.e.done(stale); assert.equal(h.e.index, 1); assert.equal(h.e.phrase, 0);
  h.e.move(-1); assert.equal(h.e.index, 0);
  h.e.move(-1); assert.equal(h.e.index, 0);
});
test('a próxima conta só acende depois da última frase da Ave-Maria', () => {
  const h = harness('gozosos', 3); h.e.start(); assert.equal(h.e.step.bead, 1);
  const len = h.e.step.phrases.length;
  for (let n = 0; n < len - 1; n++) { h.e.done(h.e.activeId); assert.equal(h.e.step.bead, 1); }
  h.e.done(h.e.activeId); assert.equal(h.e.step.bead, 2); assert.equal(h.leds.at(-1), 2);
});
test('erro de áudio pausa sem avançar e pode ser retomado', () => {
  const h = harness('gozosos', 3); h.e.start(); h.e.error(h.e.activeId, 'Sem voz');
  assert.equal(h.e.playing, false); assert.equal(h.e.index, 3); assert.deepEqual(h.errors, ['Sem voz']);
  h.e.start(); assert.equal(h.e.playing, true);
});
test('troca de mistérios e reinício invalidam a sessão anterior', () => {
  const h = harness(); h.e.start(); const old = h.e.activeId;
  h.e.reset('dolorosos'); h.e.done(old);
  assert.equal(h.e.group, 'dolorosos'); assert.equal(h.e.index, 0); assert.equal(h.e.playing, false);
  h.e.move(79); assert.equal(h.finishes, 1);
  h.e.start(); assert.equal(h.e.index, 0); assert.equal(h.e.finished, false);
});
test('progresso salvo inválido é limitado a uma etapa válida', () => {
  assert.equal(harness('gloriosos', -20).e.index, 0);
  assert.equal(harness('gloriosos', 2000).e.index, 78);
  assert.equal(harness('gloriosos', 'lixo').e.index, 0);
});

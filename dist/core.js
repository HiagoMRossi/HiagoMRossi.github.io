/* Núcleo independente de Android: sequência, sincronização e cancelamento. */
(function (root) {
  'use strict';
  const prayers = {
    sinal: 'Em nome do Pai, do Filho e do Espírito Santo. Amém.',
    credo: 'Creio em Deus Pai todo-poderoso, Criador do céu e da terra. E em Jesus Cristo, seu único Filho, nosso Senhor, que foi concebido pelo poder do Espírito Santo, nasceu da Virgem Maria, padeceu sob Pôncio Pilatos, foi crucificado, morto e sepultado. Desceu à mansão dos mortos, ressuscitou ao terceiro dia, subiu aos céus, está sentado à direita de Deus Pai todo-poderoso, donde há de vir a julgar os vivos e os mortos. Creio no Espírito Santo, na Santa Igreja Católica, na comunhão dos santos, na remissão dos pecados, na ressurreição da carne, na vida eterna. Amém.',
    pai: 'Pai nosso que estais nos céus, santificado seja o vosso nome. Venha a nós o vosso Reino. Seja feita a vossa vontade, assim na terra como no céu. O pão nosso de cada dia nos dai hoje. Perdoai-nos as nossas ofensas, assim como nós perdoamos a quem nos tem ofendido. E não nos deixeis cair em tentação, mas livrai-nos do mal. Amém.',
    ave: 'Ave Maria, cheia de graça, o Senhor é convosco. Bendita sois vós entre as mulheres, e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós, pecadores, agora e na hora de nossa morte. Amém.',
    gloria: 'Glória ao Pai, ao Filho e ao Espírito Santo. Como era no princípio, agora e sempre. Amém.',
    fatima: 'Ó meu Jesus, perdoai-nos, livrai-nos do fogo do inferno. Levai as almas todas para o céu e socorrei principalmente as que mais precisarem da vossa misericórdia.',
    salve: 'Salve, Rainha, Mãe de misericórdia, vida, doçura e esperança nossa, salve! A vós bradamos, os degredados filhos de Eva. A vós suspiramos, gemendo e chorando neste vale de lágrimas. Eia, pois, advogada nossa, esses vossos olhos misericordiosos a nós volvei. E depois deste desterro, mostrai-nos Jesus, bendito fruto do vosso ventre. Ó clemente, ó piedosa, ó doce sempre Virgem Maria! Rogai por nós, Santa Mãe de Deus. Para que sejamos dignos das promessas de Cristo. Amém.'
  };
  const mysteries = {
    gozosos: { label: 'Mistérios gozosos', days: 'Segunda e sábado', items: ['A anunciação do anjo a Maria', 'A visita de Maria a Isabel', 'O nascimento de Jesus', 'A apresentação de Jesus no templo', 'O encontro de Jesus no templo'] },
    dolorosos: { label: 'Mistérios dolorosos', days: 'Terça e sexta', items: ['A agonia de Jesus no Horto', 'A flagelação de Jesus', 'A coroação de espinhos', 'Jesus carrega a cruz', 'A crucificação e morte de Jesus'] },
    gloriosos: { label: 'Mistérios gloriosos', days: 'Quarta e domingo', items: ['A ressurreição de Jesus', 'A ascensão de Jesus ao céu', 'A vinda do Espírito Santo', 'A assunção de Maria ao céu', 'A coroação de Maria'] },
    luminosos: { label: 'Mistérios luminosos', days: 'Quinta', items: ['O batismo de Jesus no Jordão', 'A revelação de Jesus nas bodas de Caná', 'O anúncio do Reino de Deus', 'A transfiguração de Jesus', 'A instituição da Eucaristia'] }
  };
  const ordinals = ['Primeiro', 'Segundo', 'Terceiro', 'Quarto', 'Quinto'];
  function suggestedGroup(day = new Date().getDay()) {
    return ['gloriosos', 'gozosos', 'dolorosos', 'gloriosos', 'luminosos', 'dolorosos', 'gozosos'][day] || 'gloriosos';
  }
  function phrases(text) {
    return (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text]).map(x => x.trim()).filter(Boolean);
  }
  function sequence(group) {
    if (!mysteries[group]) throw new Error('Mistérios desconhecidos.');
    const steps = [];
    function add(kind, title, text, bead, decade = 0, count = 0) {
      steps.push({ kind, title, text, bead, decade, count, phrases: phrases(text) });
    }
    add('sinal', 'Sinal da cruz', prayers.sinal, null);
    add('credo', 'Creio', prayers.credo, null);
    add('pai', 'Pai-nosso', prayers.pai, 0);
    for (let i = 1; i <= 3; i++) add('ave', 'Ave-Maria', prayers.ave, i, 0, i);
    add('gloria', 'Glória ao Pai', prayers.gloria, 3);
    for (let d = 0; d < 5; d++) {
      const bead = 4 + d * 11;
      add('misterio', mysteries[group].items[d], ordinals[d] + ' mistério. ' + mysteries[group].items[d] + '.', bead, d + 1);
      add('pai', 'Pai-nosso', prayers.pai, bead, d + 1);
      for (let n = 1; n <= 10; n++) add('ave', 'Ave-Maria', prayers.ave, bead + n, d + 1, n);
      // Glória e jaculatória mantêm a décima conta acesa.
      add('gloria', 'Glória ao Pai', prayers.gloria, bead + 10, d + 1);
      add('fatima', 'Ó meu Jesus', prayers.fatima, bead + 10, d + 1);
    }
    add('salve', 'Salve-Rainha', prayers.salve, null);
    add('sinal', 'Sinal da cruz', prayers.sinal, null);
    return steps;
  }
  class PrayerEngine {
    constructor(host, group, savedIndex = 0) {
      this.host = host;
      this.group = mysteries[group] ? group : suggestedGroup();
      this.steps = sequence(this.group);
      this.index = Number.isInteger(savedIndex) ? Math.max(0, Math.min(this.steps.length - 1, savedIndex)) : 0;
      this.phrase = 0;
      this.playing = false;
      this.finished = false;
      this.counter = 0;
      this.activeId = null;
      this.rate = 0.85;
    }
    get step() { return this.steps[this.index]; }
    snapshot() { return { group: this.group, index: this.index, phrase: this.phrase, playing: this.playing, finished: this.finished, step: this.step, total: this.steps.length }; }
    changed() { this.host.change(this.snapshot()); }
    invalidate() { this.activeId = null; this.counter++; this.host.stop(); }
    speak() {
      if (!this.playing || this.finished) return;
      const id = 'prayer-' + (++this.counter);
      this.activeId = id;
      this.changed();
      try { this.host.speak(this.step.phrases[this.phrase], id, this.rate); }
      catch (e) { this.error(id, e.message); }
    }
    start() {
      if (this.playing) return;
      if (this.finished) this.reset(this.group);
      this.playing = true;
      this.host.led(this.step.bead);
      this.speak();
    }
    pause() {
      this.playing = false;
      this.invalidate();
      this.changed();
    }
    done(id) {
      // Um onDone atrasado, duplicado ou de uma frase cancelada nunca avança.
      if (!this.playing || !id || id !== this.activeId) return;
      this.activeId = null;
      if (++this.phrase < this.step.phrases.length) this.speak();
      else this.move(1);
    }
    error(id, message) {
      if (id !== this.activeId) return;
      this.pause();
      this.host.error(message || 'Não foi possível reproduzir a voz.');
    }
    move(delta) {
      if (!Number.isInteger(delta)) return;
      const wasPlaying = this.playing;
      this.invalidate();
      if (this.index + delta >= this.steps.length) {
        this.index = this.steps.length - 1;
        this.phrase = 0;
        this.playing = false;
        this.finished = true;
        this.changed();
        this.host.finish();
        return;
      }
      this.index = Math.max(0, this.index + delta);
      this.phrase = 0;
      this.finished = false;
      this.playing = wasPlaying;
      this.host.led(this.step.bead);
      this.changed();
      if (wasPlaying) this.speak();
    }
    reset(group = this.group) {
      this.playing = false;
      this.invalidate();
      this.group = mysteries[group] ? group : this.group;
      this.steps = sequence(this.group);
      this.index = 0;
      this.phrase = 0;
      this.finished = false;
      this.host.led(null);
      this.changed();
    }
  }
  const api = { prayers, mysteries, phrases, sequence, suggestedGroup, PrayerEngine };
  root.Terco = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const native = window.NativeTerco;
  const model = window.Terco;
  const bluetooth = window.TercoBluetooth;
  let activeProfile = 'sp105e', connectionBusy = false, lightBusy = false;
  const webBle = native ? null : new bluetooth.WebBle({
    onStatus: data => window.nativeEvent('ble', data),
    onWrite: () => { $('last-command').textContent = 'Comando enviado por Bluetooth. Confira o resultado nos LEDs.'; }
  });
  let connected = false, effectFrame = null, effectActive = false;
  let brightness = 32, voiceReady = !native && ('speechSynthesis' in window), currentUtterance = null;
  let lastStep = -1;
  const nodes = [];
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('lumen-progress-v1') || '{}') || {}; } catch (_) { /* Storage may be unavailable in a file preview. */ }
  const svgNS = 'http://www.w3.org/2000/svg';
  function circle(x, y, radius, className) {
    const el = document.createElementNS(svgNS, 'circle');
    for (const [key, value] of Object.entries({ cx: x, cy: y, r: radius, class: className })) el.setAttribute(key, value);
    return el;
  }
  for (let i = 0; i < 59; i++) {
    let x, y;
    if (i < 5) { x = 170; y = 295 - i * 16; }
    else {
      const a = Math.PI / 2 + (i - 4.5) * Math.PI * 2 / 54;
      x = 170 + 120 * Math.cos(a); y = 113 + 94 * Math.sin(a);
    }
    const radius = [0, 4, 15, 26, 37, 48].includes(i) ? 5.4 : 3.8;
    const halo = circle(x, y, radius + 3, 'bead-halo');
    const bead = circle(x, y, radius, 'bead');
    const title = document.createElementNS(svgNS, 'title'); title.textContent = 'Conta ' + (i + 1); bead.append(title);
    $('beads').append(halo, bead); nodes.push({ bead, halo });
  }
  for (const [key, m] of Object.entries(model.mysteries)) {
    const option = document.createElement('option'); option.value = key; option.textContent = m.label; $('mystery').append(option);
  }
  function notice(text, error = false) { $('notice').textContent = text; $('notice').classList.toggle('error', error); }
  function send(op, bead = null) {
    if (!connected || activeProfile !== 'terco') return;
    if (native) native.command(op, bead === null ? -1 : bead, brightness);
    else webBle.command(op, bead, brightness);
  }
  function board(on) {
    if (!connected || activeProfile !== 'nucleo') return;
    if (native) native.testBoard(on); else webBle.board(on);
    $('last-command').textContent = on ? 'Acendimento do LED azul solicitado.' : 'Desligamento do LED azul solicitado.';
  }
  async function testSp105e(action) {
    if (!connected || activeProfile !== 'sp105e' || lightBusy || connectionBusy) return;
    lightBusy = true; updateLights();
    $('last-command').textContent = 'Enviando o teste…';
    if (native) { native.testSp105e(action); return; }
    try {
      const sent = await webBle.sp105e(action);
      if (sent) $('last-command').textContent = action === 'toggle' ? 'Alternância enviada. Confira se o cordão ligou ou desligou.' : action === 'black' ? 'Cor preta enviada para apagar o cordão.' : 'Cor enviada. Se não acender, toque uma vez em Ligar / desligar.';
      else if (connected) $('last-command').textContent = 'O comando não foi enviado. Aguarde e tente novamente.';
    } finally { lightBusy = false; updateLights(); }
  }
  function cancelEffect() {
    if (effectFrame !== null) cancelAnimationFrame(effectFrame);
    effectFrame = null; effectActive = false;
    for (const n of nodes) n.halo.style.opacity = '';
  }
  function paintLed(bead, all = false, strength = 1) {
    for (let i = 0; i < nodes.length; i++) {
      const on = all || i === bead;
      nodes[i].bead.classList.toggle('on', on);
      nodes[i].halo.classList.toggle('on', on);
      nodes[i].halo.style.opacity = on ? String(strength * .85) : '0';
      // Durante as pulsações, inclusive o núcleo reduz de intensidade.
      nodes[i].bead.style.fill = all ? `rgba(255,180,82,${.14 + strength * .86})` : '';
    }
  }
  function led(bead) { cancelEffect(); paintLed(bead); send(bead === null ? 0 : 1, bead); }
  function celebration() {
    cancelEffect(); effectActive = true; send(2);
    const start = performance.now();
    function frame(now) {
      const elapsed = now - start;
      if (elapsed < 4720) paintLed(Math.min(58, Math.floor(elapsed / 80)));
      else if (elapsed < 8320) {
        const phase = (elapsed - 4720) % 1200 / 1200;
        paintLed(null, true, Math.pow(Math.sin(Math.PI * phase), 2));
      } else {
        cancelEffect(); paintLed(engine.finished ? null : engine.step.bead);
        // Uma prévia deve restaurar a conta em que a oração estava pausada.
        send(engine.finished || engine.step.bead === null ? 0 : 1, engine.finished ? null : engine.step.bead);
        return;
      }
      effectFrame = requestAnimationFrame(frame);
    }
    effectFrame = requestAnimationFrame(frame);
  }
  const engine = new model.PrayerEngine({
    speak(text, id, rate) {
      if (!voiceReady) throw new Error('Configure uma voz em português para iniciar a narração.');
      if (native) { native.speak(text, id, rate); return; }
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = speechSynthesis.getVoices();
      utterance.voice = voices.find(v => /^pt[-_]BR$/i.test(v.lang)) || voices.find(v => /^pt/i.test(v.lang)) || null;
      utterance.lang = 'pt-BR'; utterance.rate = rate;
      utterance.onend = () => engine.done(id);
      utterance.onerror = e => engine.error(id, 'A voz foi interrompida (' + e.error + '). Tente retomar.');
      currentUtterance = utterance;
      speechSynthesis.speak(utterance);
    },
    stop() { if (native) native.stop(); else if ('speechSynthesis' in window) speechSynthesis.cancel(); currentUtterance = null; },
    led,
    change(state) { render(state); },
    finish() { notice('Oração concluída. Um instante de luz para encerrar.'); celebration(); },
    error(message) { notice(message, true); }
  }, saved.group || model.suggestedGroup(), saved.index || 0);
  function render(s) {
    const step = s.step;
    $('mystery').value = s.group;
    $('day-label').textContent = model.mysteries[s.group].days;
    $('play-symbol').textContent = s.playing ? 'Ⅱ' : '▶';
    $('play-label').textContent = s.playing ? 'Pausar' : s.finished ? 'Rezar novamente' : s.index || s.phrase ? 'Continuar oração' : 'Iniciar terço';
    $('play').disabled = !voiceReady;
    $('previous').disabled = s.index === 0 && !s.finished;
    $('next').disabled = s.finished;
    $('completion').hidden = !s.finished;
    document.querySelector('.prayer-card').hidden = s.finished;
    $('prayer-title').textContent = step.title;
    $('current-phrase').textContent = step.phrases[s.phrase] || step.phrases[0];
    $('prayer-text').textContent = step.text;
    $('section-label').textContent = step.decade ? 'MISTÉRIO ' + step.decade + ' DE 5' : s.index < 7 ? 'ORAÇÕES INICIAIS' : 'ENCERRAMENTO';
    $('step-count').textContent = (s.index + 1) + ' / ' + s.total;
    $('decade-label').textContent = s.finished ? 'EM PAZ' : step.decade ? step.decade + 'º MISTÉRIO' : s.index < 7 ? 'RECOLHA O CORAÇÃO' : 'ORAÇÕES FINAIS';
    const center = $('ring-main');
    center.textContent = s.finished ? 'Terço concluído.' : step.kind === 'ave' ? 'Ave-Maria ' + step.count + '/' + (step.decade ? 10 : 3) : step.kind === 'misterio' ? 'Contemple.' : step.title;
    if (!s.index && !s.playing && !s.phrase) center.innerHTML = 'Uma conta<br>de cada vez.';
    $('bead-label').textContent = s.finished ? 'Que a paz acompanhe você.' : step.bead === null ? 'Um momento de oração' : 'Conta ' + (step.bead + 1) + ' de 59';
    const progress = s.finished ? 100 : Math.floor(s.index / s.total * 100);
    $('progress').style.width = progress + '%';
    document.querySelector('.progress-track').setAttribute('aria-valuenow', progress);
    $('rosary').setAttribute('aria-label', s.finished ? 'Terço concluído' : step.bead === null ? 'Terço; nenhuma conta acesa' : 'Terço; conta ' + (step.bead + 1) + ' de 59 acesa');
    const visited = new Set(engine.steps.slice(0, s.index).map(x => x.bead));
    nodes.forEach((n, i) => n.bead.classList.toggle('visited', visited.has(i)));
    if (!effectActive) paintLed(s.finished ? null : step.bead);
    if (s.index !== lastStep) $('full-prayer').open = false;
    lastStep = s.index;
    if (native) native.keepAwake(s.playing);
    try { localStorage.setItem('lumen-progress-v1', JSON.stringify({ group: s.group, index: s.finished ? 0 : s.index })); } catch (_) { /* Optional persistence. */ }
  }
  function stopEffectAndRestore() { cancelEffect(); led(engine.finished ? null : engine.step.bead); }
  $('play').onclick = () => {
    stopEffectAndRestore();
    if (engine.playing) { engine.pause(); notice('Pausado. Ao continuar, repetimos a frase interrompida.'); }
    else { notice(connected && activeProfile === 'terco' ? 'A voz e o terço estão acompanhando a oração.' : 'Acompanhe as contas na tela. Você pode conectar o terço depois.'); engine.start(); }
  };
  $('previous').onclick = () => { stopEffectAndRestore(); engine.move(-1); notice('Oração anterior.'); };
  $('next').onclick = () => { stopEffectAndRestore(); engine.move(1); if (!engine.finished) notice('Próxima oração.'); };
  $('mystery').onchange = () => {
    const group = $('mystery').value;
    if ((engine.index || engine.playing) && !window.confirm('Trocar os mistérios e recomeçar este terço?')) { $('mystery').value = engine.group; return; }
    engine.reset(group); notice('Mistérios selecionados. Toque em Iniciar terço.');
  };
  $('settings-open').onclick = () => { if (engine.playing) { engine.pause(); notice('Oração pausada para ajustar.'); } stopEffectAndRestore(); $('settings').showModal(); };
  $('settings').onclick = e => { if (e.target === $('settings')) { const r = $('settings').getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) $('settings').close(); } };
  $('rate').oninput = () => { engine.rate = Number($('rate').value); $('rate-label').textContent = engine.rate.toFixed(2).replace('.', ',') + '×'; };
  $('brightness').oninput = () => { brightness = Math.max(1, Math.round(Number($('brightness').value) * 64 / 100)); $('brightness-label').textContent = $('brightness').value + '%'; send(engine.step.bead === null ? 0 : 1, engine.step.bead); };
  $('effect').onclick = () => { engine.pause(); $('settings').close(); notice('Prévia: uma onda dourada e três pulsações suaves.'); celebration(); };
  function restart() { engine.reset(); notice('Tudo pronto para um novo terço.'); }
  $('reset').onclick = () => { if (window.confirm('Recomeçar este terço do início?')) { restart(); $('settings').close(); } };
  $('again').onclick = restart;
  $('connect').onclick = () => {
    engine.pause(); stopEffectAndRestore();
    updateLights(); $('lights').showModal();
  };
  function updateLights() {
    const profile = $('light-profile').value;
    const isBoard = profile === 'nucleo', isSp = profile === 'sp105e';
    $('strand-test').hidden = profile !== 'terco';
    $('board-test').hidden = !isBoard;
    $('sp105e-test').hidden = !isSp;
    $('profile-help').textContent = isSp ? 'O Lumen conecta diretamente ao SP105E. Desconecte e feche o Magic-LED antes de selecionar o controlador aqui.' : isBoard ? 'Liga e apaga o LED azul da própria NUCLEO com a demonstração de fábrica BLE_p2pServer.' : 'Requer a NUCLEO com o firmware TercoBLE e o cordão ligado corretamente.';
    const support = native ? '' : bluetooth.availability();
    $('ble-support').textContent = support || (native ? 'Bluetooth do aplicativo Android.' : 'Bluetooth disponível neste navegador. A seleção do dispositivo abre ao tocar no botão abaixo.');
    $('ble-support').classList.toggle('error', !!support);
    $('pair').textContent = connected ? 'Desconectar dispositivo' : connectionBusy ? 'Conectando…' : isSp ? 'Conectar SP105E' : 'Escolher dispositivo Bluetooth';
    $('pair').disabled = connectionBusy;
    $('pair-all').hidden = !!native || !isSp || connected;
    $('pair-all').disabled = connectionBusy;
    $('light-profile').disabled = connected || connectionBusy;
    $('board-on').disabled = $('board-off').disabled = !connected || activeProfile !== 'nucleo';
    document.querySelectorAll('[data-sp-action]').forEach(button => { button.disabled = !connected || activeProfile !== 'sp105e' || lightBusy || connectionBusy; });
    const value = Number($('test-bead').value);
    $('test-prev').disabled = value <= 1;
    $('test-next').disabled = value >= 59;
  }
  $('light-profile').onchange = updateLights;
  function chooseDevice(acceptAllDevices = false) {
    if (connectionBusy) return;
    engine.pause(); cancelEffect();
    if (connected) { if (native) native.disconnect(); else webBle.disconnect(); return; }
    activeProfile = $('light-profile').value;
    $('last-command').textContent = '';
    $('ble-diagnostic').hidden = true;
    $('ble-diagnostic-text').textContent = '';
    if (native) native.connectProfile(activeProfile);
    else webBle.connect(activeProfile, { acceptAllDevices });
  }
  $('pair').onclick = () => chooseDevice();
  $('pair-all').onclick = () => chooseDevice(true);
  function testLight() {
    const value = Number($('test-bead').value);
    if (!Number.isInteger(value) || value < 1 || value > 59) { $('last-command').textContent = 'Escolha um número inteiro de 1 a 59.'; return; }
    cancelEffect(); paintLed(value - 1); send(1, value - 1); updateLights();
    $('last-command').textContent = connected && activeProfile === 'terco' ? 'Acendimento da conta ' + value + ' solicitado.' : 'Prévia da conta ' + value + ' na tela; nenhuma luz física foi acionada.';
  }
  $('test-on').onclick = testLight;
  $('test-bead').onchange = testLight;
  $('test-prev').onclick = () => { $('test-bead').value = Math.max(1, (Number($('test-bead').value) || 1) - 1); testLight(); };
  $('test-next').onclick = () => { $('test-bead').value = Math.min(59, (Number($('test-bead').value) || 1) + 1); testLight(); };
  $('test-off').onclick = () => { cancelEffect(); paintLed(null); send(0); $('last-command').textContent = connected && activeProfile === 'terco' ? 'Desligamento das contas solicitado.' : 'Contas apagadas na prévia.'; };
  $('board-on').onclick = () => board(true);
  $('board-off').onclick = () => board(false);
  document.querySelectorAll('[data-sp-action]').forEach(button => { button.onclick = () => testSp105e(button.dataset.spAction); });
  $('lights').addEventListener('close', () => {
    if (activeProfile === 'nucleo') board(false);
    stopEffectAndRestore(); render(engine.snapshot());
  });
  $('install-voice').onclick = () => { if (native) native.installVoice(); };
  window.nativeEvent = (name, data) => {
    if (name === 'ready') {
      voiceReady = !!data.voiceReady;
      $('install-voice').hidden = voiceReady;
      if (data.message) notice(data.message, !voiceReady);
      render(engine.snapshot());
    } else if (name === 'bleWrite') {
      lightBusy = false; updateLights();
      $('last-command').textContent = 'Comando enviado por Bluetooth. Confira o resultado nos LEDs.';
    } else if (name === 'speechDone') engine.done(data.id);
    else if (name === 'speechError') engine.error(data.id, data.message);
    else if (name === 'interrupted') {
      engine.pause(); cancelEffect(); send(engine.finished || engine.step.bead === null ? 0 : 1, engine.finished ? null : engine.step.bead); render(engine.snapshot());
      notice(data.message || 'Oração pausada. Toque em Continuar para retomar.');
    } else if (name === 'ble') {
      const wasConnected = connected;
      if (data.profile) activeProfile = data.profile;
      connected = data.state === 'connected';
      lightBusy = false;
      connectionBusy = ['scanning', 'connecting', 'disconnecting'].includes(data.state);
      $('connection-status').classList.toggle('connected', connected);
      $('connection-status').innerHTML = '<i></i>' + (connected ? activeProfile === 'sp105e' ? 'SP105E · teste de cores' : activeProfile === 'nucleo' ? 'NUCLEO · teste' : 'Terço conectado' : data.state === 'scanning' ? 'Buscando…' : data.state === 'connecting' ? 'Conectando…' : 'Contas na tela');
      $('connect').textContent = connected ? 'Luzes e conexão ↗' : 'Conectar luzes ↗';
      if (wasConnected && !connected) { engine.pause(); cancelEffect(); render(engine.snapshot()); }
      if (connected) { if (activeProfile === 'nucleo') board(false); else if (activeProfile === 'terco') led(engine.finished ? null : engine.step.bead); }
      $('lights-status').textContent = data.message || (connected ? 'Placa conectada.' : 'Nenhuma placa conectada.');
      $('lights-status').classList.toggle('error', data.state === 'error');
      if (data.diagnostic) {
        $('ble-diagnostic').hidden = false;
        $('ble-diagnostic-text').textContent = data.diagnostic;
      }
      updateLights();
      notice(data.message || (connected ? 'Terço conectado. Toque em Continuar para rezar.' : 'Sem terço conectado.'), data.state === 'error');
    }
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { engine.pause(); cancelEffect(); if (activeProfile === 'nucleo') board(false); else send(engine.finished || engine.step.bead === null ? 0 : 1, engine.finished ? null : engine.step.bead); }
  });
  window.addEventListener('pagehide', () => { engine.pause(); cancelEffect(); });
  if (!voiceReady && !native) notice('Este navegador não oferece narração. Teste no Chrome ou no aplicativo Android.', true);
  render(engine.snapshot());
  updateLights();
  if (native) native.ready();
})();

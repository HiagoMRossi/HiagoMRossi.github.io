/* Transportes BLE TercoBLE, NUCLEO e SP105E. Sem conexão automática. */
(function (root) {
  'use strict';
  const profiles = {
    sp105e: {
      service: '0000ffe0-0000-1000-8000-00805f9b34fb',
      characteristic: '0000ffe1-0000-1000-8000-00805f9b34fb',
      response: false,
      names: ['SP105E', 'SP105e', 'sp105e']
    },
    terco: {
      service: '8ec90001-f315-4f60-9fb8-838830daea50',
      characteristic: '8ec90002-f315-4f60-9fb8-838830daea50',
      response: true,
      names: ['TercoBLE']
    },
    nucleo: {
      // UUIDs e mensagens do BLE_p2pServer oficial para NUCLEO-WB05KZ.
      service: '0000fe40-cc7a-482a-984a-7f2ed5b3e58f',
      characteristic: '0000fe41-8e22-4541-9d4c-21edae82ed19',
      response: false,
      names: ['P2PSRV', 'p2pS']
    }
  };
  function sp105ePacket(action) {
    // Protocolo SP105E de 5 bytes; não usar o protocolo do SP108E/SP110E.
    // Cores de teste atenuadas. Não altera IC, ordem RGB ou número de pixels.
    const colors = { red: [32, 0, 0], green: [0, 32, 0], blue: [0, 0, 32], gold: [32, 22, 10], black: [0, 0, 0] };
    if (action === 'toggle') return Uint8Array.of(0x38, 0, 0, 0, 0xaa);
    if (!Object.prototype.hasOwnProperty.call(colors, action)) throw new Error('Teste SP105E inválido.');
    return Uint8Array.of(0x38, ...colors[action], 0x1e);
  }
  function sp105eRgbPacket(rgb) {
    if (!Array.isArray(rgb) || rgb.length !== 3 || !rgb.every(value => Number.isInteger(value) && value >= 0 && value <= 32)) throw new Error('Cor do acompanhamento fora do limite.');
    return Uint8Array.of(0x38, ...rgb, 0x1e);
  }
  function packet(opcode, bead, brightness) {
    if (!Number.isInteger(opcode) || opcode < 0 || opcode > 2) throw new Error('Comando de luz inválido.');
    if (!Number.isInteger(brightness) || brightness < 1 || brightness > 64) throw new Error('Brilho fora do limite.');
    if (opcode === 1 && (!Number.isInteger(bead) || bead < 0 || bead > 58)) throw new Error('Escolha uma conta de 1 a 59.');
    return Uint8Array.of(1, opcode, opcode === 1 ? bead : 255, brightness, 255, 180, 82, 0);
  }
  function availability(nav = root.navigator, secure = root.isSecureContext) {
    if (!secure) return 'Para conectar por Bluetooth, abra esta página por HTTPS no Chrome. O arquivo local continua funcionando com as contas na tela.';
    if (!nav || !nav.bluetooth || typeof nav.bluetooth.requestDevice !== 'function') return 'Este navegador não oferece acesso Bluetooth. Use o Chrome no Android com a página em HTTPS, ou o aplicativo Android.';
    return '';
  }
  function timed(promise, timeout, message) {
    let timer;
    return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), timeout); })]).finally(() => clearTimeout(timer));
  }
  function connectionFailure(error, stage, profile, broad = false) {
    const name = error.name || 'Error';
    const beforeSelection = stage === 'selection';
    let message;
    if (name === 'NotFoundError' && beforeSelection) {
      message = 'O Chrome encerrou a busca sem selecionar um dispositivo. ' +
        (profile === 'sp105e' && !broad ? 'Se a lista estava vazia, tente Buscar sem filtro. ' : '') +
        'Se a janela nem abriu, confira as permissões de Dispositivos próximos do Chrome.';
    } else if (name === 'SecurityError' || name === 'NotAllowedError') {
      message = 'O acesso ao Bluetooth foi bloqueado. Abra o link diretamente no Chrome e confira as permissões de Dispositivos próximos do navegador.';
    } else if (name === 'NotFoundError') {
      message = 'O dispositivo foi selecionado, mas o serviço de luz esperado não foi encontrado. Confira se escolheu o controlador correto.';
    } else if (name === 'NotSupportedError') {
      message = 'Este navegador ou sistema não disponibilizou o acesso Bluetooth necessário. Tente pelo Chrome no Android.';
    } else if (profile === 'sp105e') {
      message = 'O SP105E não concluiu a conexão. Desconecte e feche o Magic-LED, confira a alimentação e tente novamente.';
    } else message = error.message || 'Não foi possível conectar ao dispositivo.';
    return {
      state: name === 'NotFoundError' && beforeSelection ? 'disconnected' : 'error',
      message,
      diagnostic: ['Lumen web 0.4.0', 'Etapa: ' + stage, 'Busca: ' + (broad ? 'sem filtro' : 'por nome/serviço'), 'Erro: ' + name, 'Detalhe do Chrome: ' + String(error.message || '(não informado)').slice(0, 700)].join('\n')
    };
  }
  class WebBle {
    constructor({ navigator = root.navigator, secure = root.isSecureContext, onStatus = () => {}, onWrite = () => {}, timeout = 7000 } = {}) {
      this.nav = navigator; this.secure = secure; this.onStatus = onStatus; this.onWrite = onWrite; this.timeout = timeout;
      this.epoch = 0; this.connected = false; this.device = null; this.characteristic = null; this.profile = 'terco'; this.pending = null; this.pumpEpoch = null; this.closing = false;
    }
    status(state, message, diagnostic = '') { this.onStatus({ state, message, profile: this.profile, diagnostic }); }
    cleanup() {
      this.epoch++;
      this.connected = false; this.characteristic = null; this.closing = false;
      if (this.pending) this.pending.resolve(false);
      this.pending = null;
      const old = this.device;
      this.device = null;
      if (old) {
        if (this.disconnectHandler) old.removeEventListener('gattserverdisconnected', this.disconnectHandler);
        try { if (old.gatt && old.gatt.connected) old.gatt.disconnect(); } catch (_) { /* Device already gone. */ }
      }
    }
    fail(message) { this.cleanup(); this.status('error', message); }
    async connect(profile = 'terco', { acceptAllDevices = false } = {}) {
      const unavailable = availability(this.nav, this.secure);
      if (unavailable) { this.status('error', unavailable); return false; }
      if (!Object.prototype.hasOwnProperty.call(profiles, profile)) { this.status('error', 'Escolha um tipo de conexão válido.'); return false; }
      if (acceptAllDevices && profile !== 'sp105e') { this.status('error', 'A busca sem filtro é um teste para o SP105E.'); return false; }
      this.cleanup(); this.profile = profile;
      const expected = this.epoch, spec = profiles[profile];
      let stage = 'selection';
      this.status('scanning', acceptAllDevices ? 'Busca sem filtro: selecione somente o seu controlador de LEDs.' : profile === 'sp105e' ? 'Escolha o seu SP105E na janela de Bluetooth.' : 'Escolha a sua placa na janela de Bluetooth.');
      try {
        // A chamada deve ocorrer no clique, antes de qualquer await ou timer.
        const query = { optionalServices: [spec.service] };
        if (acceptAllDevices) query.acceptAllDevices = true;
        else query.filters = [{ services: [spec.service] }, ...spec.names.map(namePrefix => ({ namePrefix }))];
        const device = await this.nav.bluetooth.requestDevice(query);
        if (this.epoch !== expected) return false;
        stage = 'connection';
        if (!device.gatt) throw new Error('O dispositivo não oferece Bluetooth Low Energy.');
        this.device = device;
        this.disconnectHandler = () => { if (this.epoch === expected) { this.cleanup(); this.status('error', 'A placa desconectou. A oração foi pausada.'); } };
        device.addEventListener('gattserverdisconnected', this.disconnectHandler);
        this.status('connecting', 'Conectando à placa…');
        const opening = device.gatt.connect().then(server => {
          if (this.epoch !== expected) { if (server.connected) server.disconnect(); throw new Error('Conexão cancelada.'); }
          return server;
        });
        const server = await timed(opening, this.timeout * 2, 'A placa não respondeu à conexão.');
        stage = 'service';
        const service = await timed(server.getPrimaryService(spec.service), this.timeout, 'A placa não respondeu à descoberta de serviços.');
        stage = 'characteristic';
        const characteristic = await timed(service.getCharacteristic(spec.characteristic), this.timeout, 'A característica de luz não respondeu.');
        if (this.epoch !== expected) return false;
        const method = spec.response ? 'writeValueWithResponse' : 'writeValueWithoutResponse';
        const property = spec.response ? 'write' : 'writeWithoutResponse';
        if (!characteristic.properties[property] || typeof characteristic[method] !== 'function') throw new Error('A placa ou o navegador não oferece o tipo de escrita necessário.');
        this.characteristic = characteristic; this.connected = true;
        this.status('connected', profile === 'sp105e' ? 'SP105E conectado. Teste a pulsação e comece a oração com os 34 LEDs juntos.' : profile === 'nucleo' ? 'Placa conectada para testar o LED azul. Esse teste não controla o cordão.' : 'Terço conectado. A conta atual será sincronizada.');
        return true;
      } catch (error) {
        if (this.epoch !== expected) return false;
        const failure = connectionFailure(error, stage, profile, acceptAllDevices);
        this.cleanup(); this.status(failure.state, failure.message, failure.diagnostic); return false;
      }
    }
    command(opcode, bead, brightness) {
      if (this.profile !== 'terco') return Promise.resolve(false);
      const bytes = packet(opcode, bead, brightness);
      return this.enqueue(bytes);
    }
    board(on) {
      if (this.profile !== 'nucleo') return Promise.resolve(false);
      return this.enqueue(Uint8Array.of(1, on ? 1 : 0));
    }
    sp105e(action) {
      if (this.profile !== 'sp105e') return Promise.resolve(false);
      // O toggle é uma ação, não um estado. Nunca substituir nem repetir um
      // toggle na fila; o próximo clique deve esperar o envio atual terminar.
      if (this.pending || this.pumpEpoch !== null) return Promise.resolve(false);
      return this.enqueue(sp105ePacket(action));
    }
    sp105eRgb(rgb) {
      if (this.profile !== 'sp105e') return Promise.resolve(false);
      // Cores são estados idempotentes e usam a fila serial, inclusive ao pausar.
      return this.enqueue(sp105eRgbPacket(rgb));
    }
    enqueue(bytes, closing = false) {
      if (!this.connected || !this.characteristic || this.closing && !closing) return Promise.resolve(false);
      return new Promise(resolve => {
        // Só o último estado pendente interessa; nunca reproduzir uma fila antiga.
        if (this.pending) this.pending.resolve(false);
        this.pending = { bytes, resolve };
        this.pump(this.epoch);
      });
    }
    async pump(expected) {
      if (this.pumpEpoch === expected) return;
      this.pumpEpoch = expected;
      try {
        while (this.connected && this.epoch === expected && this.pending) {
          const item = this.pending; this.pending = null;
          const spec = profiles[this.profile];
          try {
            const method = spec.response ? 'writeValueWithResponse' : 'writeValueWithoutResponse';
            await timed(this.characteristic[method](item.bytes), this.timeout, 'A placa não respondeu ao envio.');
            if (this.epoch !== expected) { item.resolve(false); return; }
            item.resolve(true);
            this.onWrite({ profile: this.profile, bytes: Array.from(item.bytes), response: spec.response });
          } catch (error) {
            item.resolve(false);
            if (this.epoch === expected) this.fail('Falha ao enviar a luz. A oração foi pausada. ' + (error.message || ''));
            return;
          }
        }
      } finally { if (this.pumpEpoch === expected) this.pumpEpoch = null; }
    }
    async disconnect() {
      if (this.closing) return;
      const expected = this.epoch;
      if (this.connected) {
        this.closing = true;
        this.status('disconnecting', 'Enviando apagar e desconectando…');
        // Preto é idempotente; AA apenas alterna e poderia ligar ao sair.
        const off = this.profile === 'sp105e' ? sp105ePacket('black') : this.profile === 'nucleo' ? Uint8Array.of(1, 0) : packet(0, null, 1);
        await this.enqueue(off, true);
      }
      if (this.epoch !== expected) return;
      this.cleanup(); this.status('disconnected', 'Placa desconectada. Você pode continuar na tela.');
    }
  }
  const api = { profiles, packet, sp105ePacket, sp105eRgbPacket, availability, connectionFailure, WebBle };
  root.TercoBluetooth = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

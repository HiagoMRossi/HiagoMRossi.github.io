/* Acompanhamento global do SP105E: nunca endereça contas individuais. */
(function (root) {
  'use strict';
  const gold = level => [level, Math.round(level * 22 / 32), Math.round(level * 10 / 32)];
  class GuidedLights {
    constructor({ write, available, onBusy = () => {}, setTimer = setTimeout, clearTimer = clearTimeout }) {
      this.write = write; this.available = available; this.onBusy = onBusy;
      this.setTimer = setTimer; this.clearTimer = clearTimer;
      this.epoch = 0; this.waiting = null; this.playing = false; this.owned = false;
    }
    cancel() {
      this.epoch++;
      if (this.waiting) {
        this.clearTimer(this.waiting.timer);
        this.waiting.resolve(); this.waiting = null;
      }
      this.onBusy(false);
    }
    stop() {
      this.cancel(); this.playing = false;
      const shouldClear = this.owned;
      this.owned = false;
      // Apenas RGB preto; nunca alternar a energia automaticamente.
      return shouldClear ? this.write([0, 0, 0]) : Promise.resolve(false);
    }
    sync(state) {
      if (!this.available()) { this.stop(); return; }
      if (state.finished) { this.playing = false; return; }
      if (!state.playing) { this.stop(); return; }
      if (!this.playing) {
        this.cancel(); this.playing = true; this.owned = true;
        this.write(gold(6));
      }
    }
    completed(step) {
      if (this.playing && step.kind === 'ave') return this.pulse(1, false);
      return Promise.resolve(false);
    }
    wait(ms, epoch) {
      return new Promise(resolve => {
        if (epoch !== this.epoch) { resolve(); return; }
        const timer = this.setTimer(() => { this.waiting = null; resolve(); }, ms);
        this.waiting = { timer, resolve };
      });
    }
    async pulse(count = 1, endOff = true) {
      this.cancel();
      if (!this.available()) return false;
      const epoch = this.epoch;
      this.owned = true; this.onBusy(true);
      const base = endOff ? 0 : 6;
      try {
        for (let n = 0; n < count; n++) {
          for (const strength of [0, .15, .45, .8, 1, .8, .45, .15, 0]) {
            if (epoch !== this.epoch || !this.available()) return false;
            const sent = await this.write(gold(Math.round(base + (32 - base) * strength)));
            if (!sent || epoch !== this.epoch) return false;
            await this.wait(160, epoch);
          }
        }
        if (epoch !== this.epoch) return false;
        if (endOff) this.owned = false;
        return true;
      } finally {
        if (epoch === this.epoch) this.onBusy(false);
      }
    }
  }
  root.TercoLights = { GuidedLights };
  if (typeof module !== 'undefined') module.exports = root.TercoLights;
})(typeof globalThis !== 'undefined' ? globalThis : this);

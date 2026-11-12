/* Tela acesa somente enquanto a sessão está ativa e visível. */
(function (root) {
  'use strict';
  async function releaseSentinel(sentinel) {
    try { if (sentinel && !sentinel.released) await sentinel.release(); }
    catch (_) { /* O sistema pode já ter liberado a tela. */ }
  }
  class ScreenWakeLock {
    constructor({ navigator = root.navigator, document = root.document } = {}) {
      this.nav = navigator; this.document = document;
      this.active = false; this.sentinel = null; this.pending = null; this.epoch = 0;
      this.onVisibility = () => {
        if (!this.visible()) this.release();
        else if (this.active) this.acquire();
      };
      if (this.document) this.document.addEventListener('visibilitychange', this.onVisibility);
    }
    visible() { return !!this.document && !this.document.hidden; }
    setActive(active) {
      active = !!active;
      if (this.active === active) return this.pending || Promise.resolve(this.sentinel);
      this.active = active;
      return active ? this.acquire() : this.release();
    }
    acquire() {
      if (!this.active || !this.visible() || !this.nav || !this.nav.wakeLock || typeof this.nav.wakeLock.request !== 'function') return Promise.resolve(null);
      if (this.sentinel && !this.sentinel.released) return Promise.resolve(this.sentinel);
      if (this.pending) return this.pending;
      const epoch = this.epoch;
      const pending = Promise.resolve().then(async () => {
        if (epoch !== this.epoch || !this.active || !this.visible()) return null;
        const sentinel = await this.nav.wakeLock.request('screen');
        // Uma resposta atrasada nunca deve manter a tela ligada após uma pausa.
        if (epoch !== this.epoch || !this.active || !this.visible()) {
          await releaseSentinel(sentinel); return null;
        }
        this.sentinel = sentinel;
        sentinel.addEventListener('release', () => {
          if (this.sentinel === sentinel) this.sentinel = null;
        }, { once: true });
        return sentinel;
      }).catch(() => null).finally(() => {
        if (this.pending === pending) this.pending = null;
      });
      this.pending = pending;
      return pending;
    }
    release() {
      this.epoch++; this.pending = null;
      const sentinel = this.sentinel; this.sentinel = null;
      return releaseSentinel(sentinel);
    }
    destroy() {
      if (this.document) this.document.removeEventListener('visibilitychange', this.onVisibility);
      this.active = false;
      return this.release();
    }
  }
  const api = { ScreenWakeLock };
  root.LumenWakeLock = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

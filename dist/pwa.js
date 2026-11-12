/* Registro opcional: indisponibilidade ou falha não interrompem a oração. */
(function (root) {
  'use strict';
  async function registerServiceWorker(nav = root.navigator, secure = root.isSecureContext) {
    if (!secure || !nav || !('serviceWorker' in nav)) return null;
    try { return await nav.serviceWorker.register('./sw.js', { scope: './' }); }
    catch (_) { return null; }
  }
  const api = { registerServiceWorker };
  root.LumenPwa = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

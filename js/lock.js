/*
 * Password lock for the baby's gender on the setup page.
 *
 * Only a salted hash of the password is stored. This keeps the answer away
 * from anyone browsing the setup page; it is not meant to stop someone who
 * opens DevTools on the presenting laptop.
 */
(function (root) {
  'use strict';

  var MIN_LENGTH = 4;

  function hasSubtle() {
    return !!(root.crypto && root.crypto.subtle && root.TextEncoder);
  }

  // Fallback for contexts without WebCrypto (e.g. plain http on a LAN address).
  function cyrb53(str) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0; i < str.length; i++) {
      var ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  }

  function digest(algo, text) {
    if (algo === 'cyrb53') return Promise.resolve(cyrb53(text));
    if (!hasSubtle()) return Promise.reject(new Error('WebCrypto unavailable'));
    return root.crypto.subtle.digest('SHA-256', new root.TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  }

  function randomSalt() {
    var bytes = new Uint8Array(12);
    if (root.crypto && root.crypto.getRandomValues) root.crypto.getRandomValues(bytes);
    else for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    return Array.prototype.map.call(bytes, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  // '' when acceptable, otherwise a message for the user.
  function checkNewPassword(pw, confirm) {
    if (!pw || pw.length < MIN_LENGTH) return '密码至少 ' + MIN_LENGTH + ' 位';
    if (pw !== confirm) return '两次输入的密码不一致';
    return '';
  }

  function create(pw, algo) {
    algo = algo || (hasSubtle() ? 'sha256' : 'cyrb53');
    var salt = randomSalt();
    return digest(algo, salt + ':' + pw).then(function (hash) {
      return { algo: algo, salt: salt, hash: hash };
    });
  }

  function verify(lock, pw) {
    if (!lock || !lock.hash) return Promise.resolve(false);
    return digest(lock.algo, lock.salt + ':' + pw).then(function (hash) { return hash === lock.hash; });
  }

  var api = { MIN_LENGTH: MIN_LENGTH, checkNewPassword: checkNewPassword, create: create, verify: verify };

  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GenderLock = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

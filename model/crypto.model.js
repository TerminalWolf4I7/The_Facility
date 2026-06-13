// ================================================================
// crypto.model.js — Client-Side AES-256-GCM Encryption
// ================================================================
// Security design:
//   - Uses Web Crypto API (native browser, no external library)
//   - AES-256-GCM: authenticated encryption (tamper-proof)
//   - Key derived from raw Clipboard ID + app secret via PBKDF2
//     → Firebase never sees the raw ID or the plaintext content
//   - Each clip encrypted with a unique IV (random 12 bytes)
//   - Salt is unique, derived deterministically from the ID
// ================================================================

const CryptoModel = (() => {
  const ALGO = 'AES-GCM';
  const KEY_USAGE = ['encrypt', 'decrypt'];
  const ITERATIONS = 310000; // OWASP recommended for PBKDF2-SHA-256
  const APP_SECRET = 'TheF@cility-C1ipboard-2026'; // Add pepper

  // ----------------------------------------------------------------
  // Derive a CryptoKey from the raw Clipboard ID + app secret + salt
  // ----------------------------------------------------------------
  async function _deriveKeyWithSalt(clipboardId, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(clipboardId + APP_SECRET),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: ALGO, length: 256 },
      false,
      KEY_USAGE
    );
  }

  // Legacy key derivation (v1)
  async function _deriveKeyLegacy(clipboardId) {
    const enc = new TextEncoder();
    const salt = enc.encode(clipboardId.padEnd(16, '0').substring(0, 16));
    return _deriveKeyWithSalt(clipboardId, salt);
  }

  // ----------------------------------------------------------------
  // Encrypt plaintext → base64 string { salt, iv, ciphertext }
  // ----------------------------------------------------------------
  async function encrypt(plaintext, clipboardId) {
    const salt = crypto.getRandomValues(new Uint8Array(16)); // 128-bit random salt
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
    const key = await _deriveKeyWithSalt(clipboardId, salt);
    const enc = new TextEncoder();

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: ALGO, iv },
      key,
      enc.encode(plaintext)
    );

    // Pack: 'v2' + ':' + base64(salt) + ':' + base64(iv) + ':' + base64(ciphertext)
    const saltB64 = btoa(String.fromCharCode(...salt));
    const ivB64 = btoa(String.fromCharCode(...iv));
    const ctB64 = btoa(String.fromCharCode(...new Uint8Array(cipherBuffer)));

    return `v2:${saltB64}:${ivB64}:${ctB64}`;
  }

  // ----------------------------------------------------------------
  // Decrypt base64 string → plaintext (supports v2 and legacy v1)
  // ----------------------------------------------------------------
  async function decrypt(encryptedStr, clipboardId) {
    if (typeof encryptedStr !== 'string') throw new Error('Invalid encrypted data.');

    if (encryptedStr.startsWith('v2:')) {
      const parts = encryptedStr.split(':');
      if (parts.length !== 4) throw new Error('Invalid v2 encrypted format.');
      const [, saltB64, ivB64, ctB64] = parts;

      const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
      const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
      const ct = Uint8Array.from(atob(ctB64), c => c.charCodeAt(0));

      const key = await _deriveKeyWithSalt(clipboardId, salt);
      try {
        const plainBuffer = await crypto.subtle.decrypt(
          { name: ALGO, iv },
          key,
          ct
        );
        return new TextDecoder().decode(plainBuffer);
      } catch (e) {
        throw new Error('Decryption failed. Data may be corrupted or key mismatch.');
      }
    } else {
      // Legacy v1 decrypt
      const parts = encryptedStr.split(':');
      if (parts.length !== 2) throw new Error('Invalid legacy encrypted format.');
      const [ivB64, ctB64] = parts;

      const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
      const ct = Uint8Array.from(atob(ctB64), c => c.charCodeAt(0));

      const key = await _deriveKeyLegacy(clipboardId);
      try {
        const plainBuffer = await crypto.subtle.decrypt(
          { name: ALGO, iv },
          key,
          ct
        );
        return new TextDecoder().decode(plainBuffer);
      } catch (e) {
        throw new Error('Decryption failed. Legacy data may be corrupted or key mismatch.');
      }
    }
  }

  // ----------------------------------------------------------------
  // Encrypt with a custom password (for password-protected clips)
  // Key derived from the password instead of Clipboard ID
  // ----------------------------------------------------------------
  async function encryptWithPassword(plaintext, password) {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
    );
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      { name: ALGO, length: 256 },
      false,
      KEY_USAGE
    );

    const cipherBuffer = await crypto.subtle.encrypt({ name: ALGO, iv }, key, enc.encode(plaintext));

    const saltB64 = btoa(String.fromCharCode(...salt));
    const ivB64 = btoa(String.fromCharCode(...iv));
    const ctB64 = btoa(String.fromCharCode(...new Uint8Array(cipherBuffer)));

    return `pw:${saltB64}:${ivB64}:${ctB64}`;
  }

  // ----------------------------------------------------------------
  // Decrypt password-protected clip
  // ----------------------------------------------------------------
  async function decryptWithPassword(encryptedStr, password) {
    const parts = encryptedStr.split(':');
    if (parts[0] !== 'pw' || parts.length !== 4) throw new Error('Invalid format.');
    const [, saltB64, ivB64, ctB64] = parts;

    const enc = new TextEncoder();
    const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const ct = Uint8Array.from(atob(ctB64), c => c.charCodeAt(0));

    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
    );
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      { name: ALGO, length: 256 },
      false,
      KEY_USAGE
    );

    try {
      const plainBuffer = await crypto.subtle.decrypt({ name: ALGO, iv }, key, ct);
      return new TextDecoder().decode(plainBuffer);
    } catch {
      throw new Error('Wrong password or corrupted data.');
    }
  }
  // ----------------------------------------------------------------
  // Check if a string is encrypted by this module
  // ----------------------------------------------------------------
  function isEncrypted(str) {
    return typeof str === 'string' && (
      str.startsWith('v2:') ||
      (str.includes(':') && str.split(':').length === 2) ||
      str.startsWith('pw:')
    );
  }

  return { encrypt, decrypt, encryptWithPassword, decryptWithPassword, isEncrypted };
})();

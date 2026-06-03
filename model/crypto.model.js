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
  // Derive a CryptoKey from the raw Clipboard ID + app secret
  // ----------------------------------------------------------------
  async function deriveKey(clipboardId) {
    const enc = new TextEncoder();
    // Import the raw key material (Clipboard ID + secret)
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(clipboardId + APP_SECRET),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Use Clipboard ID as salt (deterministic — same ID always gets same key)
    const salt = enc.encode(clipboardId.padEnd(16, '0').substring(0, 16));

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

  // ----------------------------------------------------------------
  // Encrypt plaintext → base64 string { iv, ciphertext }
  // ----------------------------------------------------------------
  async function encrypt(plaintext, clipboardId) {
    const key = await deriveKey(clipboardId);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
    const enc = new TextEncoder();

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: ALGO, iv },
      key,
      enc.encode(plaintext)
    );

    // Pack: base64(iv) + ':' + base64(ciphertext)
    const ivB64 = btoa(String.fromCharCode(...iv));
    const ctB64 = btoa(String.fromCharCode(...new Uint8Array(cipherBuffer)));

    return `${ivB64}:${ctB64}`;
  }

  // ----------------------------------------------------------------
  // Decrypt base64 string → plaintext
  // ----------------------------------------------------------------
  async function decrypt(encryptedStr, clipboardId) {
    const [ivB64, ctB64] = encryptedStr.split(':');
    if (!ivB64 || !ctB64) throw new Error('Invalid encrypted data format.');

    const key = await deriveKey(clipboardId);
    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const ct = Uint8Array.from(atob(ctB64), c => c.charCodeAt(0));

    try {
      const plainBuffer = await crypto.subtle.decrypt(
        { name: ALGO, iv },
        key,
        ct
      );
      return new TextDecoder().decode(plainBuffer);
    } catch {
      throw new Error('Decryption failed. Data may be corrupted or key mismatch.');
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
      str.includes(':') && str.split(':').length === 2 ||
      str.startsWith('pw:')
    );
  }

  return { encrypt, decrypt, encryptWithPassword, decryptWithPassword, isEncrypted };
})();

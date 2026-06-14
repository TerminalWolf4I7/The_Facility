const ALGO = "AES-GCM";
const KEY_USAGE: KeyUsage[] = ["encrypt", "decrypt"];
const ITERATIONS = 310000; // OWASP recommended for PBKDF2-SHA-256
const APP_SECRET = "TheF@cility-C1ipboard-2026"; // Pepper key

// Helper: Derive a CryptoKey from clipboard ID + app secret + salt
async function deriveKeyWithSalt(clipboardId: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(clipboardId + APP_SECRET),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGO, length: 256 },
    false,
    KEY_USAGE
  );
}

// Legacy key derivation (v1)
async function deriveKeyLegacy(clipboardId: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const salt = enc.encode(clipboardId.padEnd(16, "0").substring(0, 16));
  return deriveKeyWithSalt(clipboardId, salt);
}

// Encrypt plaintext -> base64 string "v2:salt:iv:ciphertext"
export async function encrypt(plaintext: string, clipboardId: string): Promise<string> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16)); // 128-bit random salt
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const key = await deriveKeyWithSalt(clipboardId, salt);
  const enc = new TextEncoder();

  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    enc.encode(plaintext)
  );

  const saltB64 = btoa(String.fromCharCode(...salt));
  const ivB64 = btoa(String.fromCharCode(...iv));
  const ctB64 = btoa(String.fromCharCode(...new Uint8Array(cipherBuffer)));

  return `v2:${saltB64}:${ivB64}:${ctB64}`;
}

// Decrypt base64 string -> plaintext (supports v2 and legacy v1)
export async function decrypt(encryptedStr: string, clipboardId: string): Promise<string> {
  if (typeof encryptedStr !== "string") throw new Error("Invalid encrypted data.");

  if (encryptedStr.startsWith("v2:")) {
    const parts = encryptedStr.split(":");
    if (parts.length !== 4) throw new Error("Invalid v2 encrypted format.");
    const [, saltB64, ivB64, ctB64] = parts;

    const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const ct = Uint8Array.from(atob(ctB64), c => c.charCodeAt(0));

    const key = await deriveKeyWithSalt(clipboardId, salt);
    try {
      const plainBuffer = await window.crypto.subtle.decrypt(
        { name: ALGO, iv },
        key,
        ct
      );
      return new TextDecoder().decode(plainBuffer);
    } catch {
      throw new Error("Decryption failed. Key mismatch or corrupted data.");
    }
  } else {
    // Legacy v1 decrypt
    const parts = encryptedStr.split(":");
    if (parts.length !== 2) throw new Error("Invalid legacy encrypted format.");
    const [ivB64, ctB64] = parts;

    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const ct = Uint8Array.from(atob(ctB64), c => c.charCodeAt(0));

    const key = await deriveKeyLegacy(clipboardId);
    try {
      const plainBuffer = await window.crypto.subtle.decrypt(
        { name: ALGO, iv },
        key,
        ct
      );
      return new TextDecoder().decode(plainBuffer);
    } catch {
      throw new Error("Decryption failed. Legacy key mismatch or corrupted data.");
    }
  }
}

// Encrypt with a custom password (for password-protected clips)
export async function encryptWithPassword(plaintext: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const key = await window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: ALGO, length: 256 },
    false,
    KEY_USAGE
  );

  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    enc.encode(plaintext)
  );

  const saltB64 = btoa(String.fromCharCode(...salt));
  const ivB64 = btoa(String.fromCharCode(...iv));
  const ctB64 = btoa(String.fromCharCode(...new Uint8Array(cipherBuffer)));

  return `pw:${saltB64}:${ivB64}:${ctB64}`;
}

// Decrypt password-protected clip
export async function decryptWithPassword(encryptedStr: string, password: string): Promise<string> {
  const parts = encryptedStr.split(":");
  if (parts[0] !== "pw" || parts.length !== 4) throw new Error("Invalid format.");
  const [, saltB64, ivB64, ctB64] = parts;

  const enc = new TextEncoder();
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const ct = Uint8Array.from(atob(ctB64), c => c.charCodeAt(0));

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const key = await window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: ALGO, length: 256 },
    false,
    KEY_USAGE
  );

  try {
    const plainBuffer = await window.crypto.subtle.decrypt({ name: ALGO, iv }, key, ct);
    return new TextDecoder().decode(plainBuffer);
  } catch {
    throw new Error("Wrong password or corrupted data.");
  }
}

// Check if string is encrypted
export function isEncrypted(str: unknown): boolean {
  if (typeof str !== "string") return false;
  return (
    str.startsWith("v2:") ||
    (str.includes(":") && str.split(":").length === 2) ||
    str.startsWith("pw:")
  );
}

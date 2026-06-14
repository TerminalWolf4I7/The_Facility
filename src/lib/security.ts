// HTML Entity Escaping (XSS Prevention)
export function escapeHtml(val: unknown): string {
  const str = val === null || val === undefined ? "" : String(val);
  return str.replace(/[&<>"'/`]/g, (match) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "/": "&#x2F;",
      "`": "&#x60;",
    };
    return map[match];
  });
}

// Attribute Value Escaping
export function escapeAttr(val: unknown): string {
  return escapeHtml(val);
}

// Input Validation for Clipboard ID
export function validateClipboardId(id: unknown): boolean {
  if (typeof id !== "string") return false;
  const trimmed = id.trim();
  if (trimmed.length < 6 || trimmed.length > 256) return false;
  // Allow alphanumeric characters, dash, and underscore
  const idRegex = /^[a-zA-Z0-9\-_]+$/;
  return idRegex.test(trimmed);
}

// Client-side Rate Limiting helper
export interface RateLimiter {
  check(): boolean;
  reset(): void;
  getRemainingTime(): number;
}

export function createRateLimiter(maxAttempts: number, windowMs: number): RateLimiter {
  let attempts: number[] = [];
  return {
    check: () => {
      const now = Date.now();
      attempts = attempts.filter((timestamp) => now - timestamp < windowMs);
      if (attempts.length >= maxAttempts) {
        return false;
      }
      attempts.push(now);
      return true;
    },
    reset: () => {
      attempts = [];
    },
    getRemainingTime: () => {
      if (attempts.length === 0) return 0;
      const now = Date.now();
      const oldest = attempts[0];
      const remaining = windowMs - (now - oldest);
      return Math.max(0, Math.ceil(remaining / 1000));
    },
  };
}

// Content Size Validation
export function validateContentSize(content: unknown, maxBytes: number): boolean {
  if (typeof content !== "string") return false;
  const size = new TextEncoder().encode(content).length;
  return size <= maxBytes;
}

// Client-side SHA-256 Hashing helper
export async function hashId(id: string): Promise<string> {
  if (!id) return "";
  const enc = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", enc.encode(id));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

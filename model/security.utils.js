// ================================================================
// security.utils.js — Security Utilities (OWASP Protection)
// ================================================================

window.SecurityUtils = (() => {
  // HTML Entity Escaping (A03: Injection / XSS Prevention)
  function escapeHtml(val) {
    const str = val === null || val === undefined ? '' : String(val);
    return str.replace(/[&<>"'/`]/g, (match) => {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#x60;'
      };
      return map[match];
    });
  }

  // Attribute Value Escaping (A03: Injection / XSS Prevention)
  function escapeAttr(val) {
    const str = val === null || val === undefined ? '' : String(val);
    return str.replace(/[&<>"'/`]/g, (match) => {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#x60;'
      };
      return map[match];
    });
  }

  // Input Validation for Clipboard ID (A04: Insecure Design)
  function validateClipboardId(id) {
    if (typeof id !== 'string') return false;
    const trimmed = id.trim();
    if (trimmed.length < 6 || trimmed.length > 256) return false;
    // Allow alphanumeric characters, dash, and underscore
    const idRegex = /^[a-zA-Z0-9\-_]+$/;
    return idRegex.test(trimmed);
  }

  // Client-side Rate Limiting (A04: Insecure Design / A07: Auth Failures)
  function createRateLimiter(maxAttempts, windowMs) {
    let attempts = [];
    return {
      check: () => {
        const now = Date.now();
        attempts = attempts.filter(timestamp => now - timestamp < windowMs);
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
      }
    };
  }

  // Content Size Validation (A04: Insecure Design)
  function validateContentSize(content, maxBytes) {
    if (typeof content !== 'string') return false;
    const size = new TextEncoder().encode(content).length;
    return size <= maxBytes;
  }

  return {
    escapeHtml,
    escapeAttr,
    validateClipboardId,
    createRateLimiter,
    validateContentSize
  };
})();

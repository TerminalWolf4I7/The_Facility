// ================================================================
// auth.model.js — Clipboard ID Session Manager (No Firebase Auth)
// ================================================================
// Features:
//   - Local session persistence via localStorage
//   - SHA-256 hashing of Clipboard ID client-side
//   - Triggers callbacks on session change (similar to Firebase Auth observer)
// ================================================================

const AuthModel = (() => {
  let _firebaseApp = null;
  let _db = null;
  let _initialized = false;

  let _rawId = null;
  let _hashedId = null;
  let _sessionCallback = null;

  // Rate limiting (5 connection attempts per 60 seconds)
  const connectionLimiter = SecurityUtils.createRateLimiter(5, 60000);

  // XOR-based Obfuscation using browser fingerprint
  function _obfuscate(text, key) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
  }

  function _deobfuscate(b64, key) {
    try {
      const text = atob(b64);
      let result = '';
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    } catch (e) {
      return null;
    }
  }

  // ----------------------------------------------------------------
  // SHA-256 Hashing helper
  // ----------------------------------------------------------------
  async function _hashId(id) {
    if (!id) return '';
    const enc = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(id));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ----------------------------------------------------------------
  // Initialize Firebase Firestore and check localStorage
  // ----------------------------------------------------------------
  async function init(config) {
    if (_initialized) return { db: _db };

    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
    const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

    _firebaseApp = initializeApp(config);
    _db = getFirestore(_firebaseApp);

    // Compute browser fingerprint (User-Agent based hash)
    const fp = await _hashId(navigator.userAgent);
    const now = Date.now();

    // Check legacy plaintext session ID and upgrade it
    const savedIdLegacy = localStorage.getItem('the_facility_clipboard_id');
    if (savedIdLegacy) {
      if (SecurityUtils.validateClipboardId(savedIdLegacy)) {
        _rawId = savedIdLegacy;
        _hashedId = await _hashId(savedIdLegacy);
        localStorage.setItem('the_facility_clipboard_id_enc', _obfuscate(savedIdLegacy, fp));
        localStorage.setItem('the_facility_clipboard_fp', fp);
        localStorage.setItem('the_facility_clipboard_last_active', now.toString());
      }
      localStorage.removeItem('the_facility_clipboard_id');
    } else {
      // Restore encrypted session from localStorage
      const encryptedId = localStorage.getItem('the_facility_clipboard_id_enc');
      const storedFp = localStorage.getItem('the_facility_clipboard_fp');
      const lastActive = localStorage.getItem('the_facility_clipboard_last_active');

      let sessionValid = true;
      if (lastActive) {
        const diff = now - parseInt(lastActive, 10);
        if (diff > 86400000) { // 24 hours
          sessionValid = false;
        }
      } else {
        sessionValid = false;
      }

      if (storedFp !== fp) {
        sessionValid = false;
      }

      if (sessionValid && encryptedId) {
        const decrypted = _deobfuscate(encryptedId, fp);
        if (decrypted && SecurityUtils.validateClipboardId(decrypted)) {
          _rawId = decrypted;
          _hashedId = await _hashId(decrypted);
          localStorage.setItem('the_facility_clipboard_last_active', now.toString()); // Update timestamp
        } else {
          clearSession();
        }
      } else {
        clearSession();
      }
    }

    _initialized = true;

    // Trigger callback if registered before init finishes
    if (_sessionCallback) {
      _sessionCallback(_rawId, _hashedId);
    }

    return { db: _db };
  }

  // ----------------------------------------------------------------
  // Get database instance
  // ----------------------------------------------------------------
  function getDb() { return _db; }

  // ----------------------------------------------------------------
  // Set the active session ID (Connects user)
  // ----------------------------------------------------------------
  async function setClipboardId(id) {
    if (!id || !id.trim()) throw new Error('Clipboard ID cannot be empty.');

    // Rate limiting check
    if (!connectionLimiter.check()) {
      const remaining = connectionLimiter.getRemainingTime();
      throw new Error(`พยายามเชื่อมต่อบ่อยเกินไป กรุณารออีก ${remaining} วินาที (Too many attempts. Please wait.)`);
    }

    const cleanId = id.trim();
    // Input validation
    if (!SecurityUtils.validateClipboardId(cleanId)) {
      throw new Error('รหัสคลิปบอร์ดไม่ถูกต้อง ต้องมีความยาว 6-256 ตัวอักษร และประกอบด้วยตัวภาษาอังกฤษ ตัวเลข ขีด (-) หรืออันเดอร์สกอร์ (_) เท่านั้น');
    }

    _rawId = cleanId;
    _hashedId = await _hashId(_rawId);

    const fp = await _hashId(navigator.userAgent);
    localStorage.setItem('the_facility_clipboard_id_enc', _obfuscate(_rawId, fp));
    localStorage.setItem('the_facility_clipboard_fp', fp);
    localStorage.setItem('the_facility_clipboard_last_active', Date.now().toString());

    if (_sessionCallback) {
      _sessionCallback(_rawId, _hashedId);
    }

    return { rawId: _rawId, hashedId: _hashedId };
  }

  // ----------------------------------------------------------------
  // Clear the active session (Disconnects user)
  // ----------------------------------------------------------------
  function clearSession() {
    _rawId = null;
    _hashedId = null;
    localStorage.removeItem('the_facility_clipboard_id_enc');
    localStorage.removeItem('the_facility_clipboard_fp');
    localStorage.removeItem('the_facility_clipboard_last_active');
    localStorage.removeItem('the_facility_clipboard_id'); // old key cleanup

    if (_sessionCallback) {
      _sessionCallback(null, null);
    }
  }

  // ----------------------------------------------------------------
  // Session observer
  // ----------------------------------------------------------------
  function onSessionChange(callback) {
    _sessionCallback = callback;
    if (_initialized) {
      callback(_rawId, _hashedId);
    }
  }

  // ----------------------------------------------------------------
  // Get current session data
  // ----------------------------------------------------------------
  function getClipboardId() { return _rawId; }
  function getHashedId() { return _hashedId; }
  function getCurrentUser() {
    // Return dummy user object for compatibility in UI
    return _rawId ? { uid: _hashedId, email: _rawId } : null;
  }

  return {
    init,
    getDb,
    setClipboardId,
    clearSession,
    onSessionChange,
    getClipboardId,
    getHashedId,
    getCurrentUser
  };
})();


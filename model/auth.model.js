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

    // Restore session from localStorage
    const savedId = localStorage.getItem('the_facility_clipboard_id');
    if (savedId) {
      _rawId = savedId;
      _hashedId = await _hashId(savedId);
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
    
    _rawId = id.trim();
    _hashedId = await _hashId(_rawId);
    
    localStorage.setItem('the_facility_clipboard_id', _rawId);
    
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
    localStorage.removeItem('the_facility_clipboard_id');
    
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


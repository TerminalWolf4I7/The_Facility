// ──────────────────────────────────────────────────────────────────
// TOGGLE HELPERS (custom checkboxes)
// ──────────────────────────────────────────────────────────────────
function initToggle(checkboxId, trackId, thumbId, onChange) {
  const cb = document.getElementById(checkboxId);
  const track = document.getElementById(trackId);
  const thumb = document.getElementById(thumbId);
  if (!cb || !track || !thumb) return;

  function update() {
    if (cb.checked) {
      track.style.background = 'linear-gradient(135deg, #10b981, #0d9488)';
      track.style.borderColor = 'rgba(16,185,129,0.5)';
      thumb.style.left = '26px';
      thumb.style.background = 'white';
    } else {
      track.style.background = 'rgba(255,255,255,0.08)';
      track.style.borderColor = 'rgba(255,255,255,0.1)';
      thumb.style.left = '4px';
      thumb.style.background = 'rgba(255,255,255,0.4)';
    }
    if (onChange) onChange(cb.checked);
  }

  track.style.transition = 'all 0.25s';
  thumb.style.transition = 'left 0.25s';
  cb.addEventListener('change', update);
  update();
}

// ──────────────────────────────────────────────────────────────────
// PASSWORD STRENGTH
// ──────────────────────────────────────────────────────────────────
function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { cls: 'str-weak',   label: 'Weak — add numbers & symbols' };
  if (score === 2) return { cls: 'str-fair',   label: 'Fair — try a longer password' };
  if (score === 3) return { cls: 'str-good',   label: 'Good' };
  return              { cls: 'str-strong', label: 'Strong 💪' };
}

// Ensure globally accessible (since it might be used globally or just locally)
function applyStrength(inputEl, meterEl, labelEl) {
  if (!inputEl || !meterEl) return;
  inputEl.addEventListener('input', () => {
    const pw = inputEl.value;
    if (!pw) { meterEl.className = 'strength-bar'; return; }
    const str = getStrength(pw);
    meterEl.className = 'strength-bar ' + str.cls;
    if (labelEl) labelEl.textContent = str.label;
  });
}

// ──────────────────────────────────────────────────────────────────
// TOAST
// ──────────────────────────────────────────────────────────────────
const _activeToasts = [];
function showToast(message, type = 'success', duration = 3000) {
  const colors = {
    success: 'rgba(16,185,129,0.3)',
    error:   'rgba(239,68,68,0.3)',
    info:    'rgba(6,182,212,0.3)',
    warn:    'rgba(245,158,11,0.3)',
  };
  const icons = {
    success: '✓', error: '✕', info: 'ℹ', warn: '⚠'
  };

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.borderColor = colors[type] || colors.info;
  toast.innerHTML = `<span style="color:${type==='success'?'#34d399':type==='error'?'#f87171':type==='warn'?'#fbbf24':'#22d3ee'}">${icons[type]}</span> ${message}`;
  document.getElementById('toastContainer').appendChild(toast);

  gsap.to(toast, { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' });
  setTimeout(() => {
    gsap.to(toast, { y: 20, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => toast.remove() });
  }, duration);
}

// ──────────────────────────────────────────────────────────────────
// LANGUAGE BADGE CLASS
// ──────────────────────────────────────────────────────────────────
function getLangClass(lang) {
  const map = { javascript:'lang-js', python:'lang-py', html:'lang-html', css:'lang-css', json:'lang-json', sql:'lang-sql', plain:'lang-plain' };
  return map[lang] || 'lang-other';
}

// ──────────────────────────────────────────────────────────────────
// EXPIRY HELPERS
// ──────────────────────────────────────────────────────────────────
function expiryValueToDate(val) {
  if (!val) return null;
  if (val === 'custom') {
    const customVal = document.getElementById('clipExpireCustomInput').value;
    return customVal ? new Date(customVal) : null;
  }
  const now = new Date();
  if (val === '1h')  now.setHours(now.getHours() + 1);
  if (val === '24h') now.setHours(now.getHours() + 24);
  if (val === '7d')  now.setDate(now.getDate() + 7);
  if (val === '30d') now.setDate(now.getDate() + 30);
  return now;
}

function formatExpiry(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = d - new Date();
  if (diff < 0) return 'Expired';
  if (diff < 3600000) return `Expires in ${Math.ceil(diff/60000)}m`;
  if (diff < 86400000) return `Expires in ${Math.ceil(diff/3600000)}h`;
  return `Expires ${d.toLocaleDateString()}`;
}

// ──────────────────────────────────────────────────────────────────
// CLIP CARD HTML
// ──────────────────────────────────────────────────────────────────
function buildClipCard(clip) {
  const expiry = clip.expiresAt ? formatExpiry(clip.expiresAt) : '';
  const expiryHTML = expiry ? `<span class="expire-badge"><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${expiry}</span>` : '';
  const isPasswordProtected = clip.hasPassword;
  const preview = isPasswordProtected
    ? '<span class="text-amber-400/70">🔒 Password protected</span>'
    : (clip.content || '').substring(0, 160);

  const date = clip.updatedAt ? (clip.updatedAt.toDate ? clip.updatedAt.toDate() : new Date(clip.updatedAt)) : new Date();
  const dateStr = date.toLocaleDateString('en', { month:'short', day:'numeric', year:'numeric' });

  return `
    <div class="clip-card" data-id="${clip.id}" role="button" tabindex="0">
      <div class="flex items-start justify-between gap-2 mb-3">
        <h4 class="font-semibold text-white text-sm truncate flex-1">${escapeHtml(clip.title)}</h4>
        <div class="flex items-center gap-1.5 flex-shrink-0">
          ${clip.isPublic ? `<svg class="w-3.5 h-3.5 text-teal-400 flex-shrink-0" title="Shared" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/></svg>` : ''}
          ${clip.hasPassword ? `<svg class="w-3.5 h-3.5 text-amber-400 flex-shrink-0" title="Password protected" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>` : ''}
        </div>
      </div>

      <div class="clip-preview mb-3">${isPasswordProtected ? preview : escapeHtml(preview)}</div>

      <div class="flex items-center justify-between mt-3">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="lang-badge ${getLangClass(clip.language)}">${clip.language || 'plain'}</span>
          ${expiryHTML}
        </div>
        <span class="text-white/25 text-xs">${dateStr}</span>
      </div>

      <!-- Quick action buttons -->
      <div class="flex gap-1.5 mt-4 pt-3 border-t border-white/05">
        <button class="btn-icon success flex-1 quick-copy" data-id="${clip.id}" title="Quick copy" style="width:auto;flex:1;">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2H8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3"/></svg>
        </button>
        <button class="btn-icon flex-1 quick-edit" data-id="${clip.id}" title="Edit" style="width:auto;flex:1;">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
        </button>
        <button class="btn-icon danger flex-1 quick-delete" data-id="${clip.id}" title="Delete" style="width:auto;flex:1;">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ──────────────────────────────────────────────────────────────────
// MAIN APP
// ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Init Firebase
  try {
    await AuthModel.init(FIREBASE_CONFIG);
  } catch (e) {
    showToast('Firebase init failed. Check firebase-config.js', 'error', 8000);
    console.error(e);
    return;
  }

  // ── State ────────────────────────────────────────────────────────
  let currentUser = null;
  let allClips = [];
  let editingClip = null;      // Clip being edited
  let viewingClip = null;      // Clip in view modal
  let unlockedContent = null;  // Decrypted content for password clips

  // ── DOM refs ─────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const sessionView = $('sessionView');
  const clipModal   = $('clipModal');
  const viewModal   = $('viewClipModal');
  const appView     = $('appView');
  const shareView   = $('shareView');
  const clipsGrid   = $('clipsGrid');
  const emptyState  = $('emptyState');
  const loadingState = $('loadingState');

  // ── Init toggles ─────────────────────────────────────────────────
  initToggle('clipPublicToggle', 'publicTrack', 'publicThumb');
  initToggle('clipPasswordToggle', 'passTrack', 'passThumb', (checked) => {
    $('clipPasswordField').classList.toggle('hidden', !checked);
    if (!checked) $('clipPasswordInput').value = '';
  });

  // ── Custom Expiration change listener ────────────────────────────
  $('clipExpireInput').addEventListener('change', () => {
    const isCustom = $('clipExpireInput').value === 'custom';
    $('clipExpireCustomField').classList.toggle('hidden', !isCustom);
    if (isCustom) {
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const localISO = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      $('clipExpireCustomInput').min = localISO;
      const defaultDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const defaultISO = `${defaultDate.getFullYear()}-${pad(defaultDate.getMonth()+1)}-${pad(defaultDate.getDate())}T${pad(defaultDate.getHours())}:${pad(defaultDate.getMinutes())}`;
      $('clipExpireCustomInput').value = defaultISO;
    }
  });

  // ── Password strength meters ──────────────────────────────────────
  applyStrength($('clipPasswordInput'), document.querySelector('#clipPasswordField .strength-bar'), $('clipStrengthLabel'));

  // ── Session Input Visibility toggle ──────────────────────────────
  $('toggleSessionInputVis').addEventListener('click', () => {
    const inp = $('sessionInput');
    inp.type = inp.type === 'password' ? 'text' : 'password';
    $('toggleSessionInputVis').innerHTML = inp.type === 'password'
      ? `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`
      : `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>`;
  });

  // ── Check for share view ──────────────────────────────────────────
  const params = new URLSearchParams(window.location.search);
  const shareId = params.get('share');

  if (shareId) {
    appView.classList.add('hidden');
    sessionView.classList.add('hidden');
    shareView.style.display = 'block';
    loadShareView(shareId);
  }

  // ── Session state observer ─────────────────────────────────────────
  let sessionMasked = true;

  AuthModel.onSessionChange(async (rawId, hashedId) => {
    if (rawId) {
      currentUser = { uid: hashedId, email: rawId };
      updateNavSession(rawId);
      if (!shareId) {
        sessionView.classList.add('hidden');
        appView.classList.remove('hidden');
        await loadClips();
      }
    } else {
      currentUser = null;
      clearNavSession();
      if (!shareId) {
        appView.classList.add('hidden');
        sessionView.classList.remove('hidden');
        gsap.fromTo($('sessionBox'), { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' });
      }
    }
  });

  // ── GSAP entry animations ─────────────────────────────────────────
  gsap.from('#mainNav', { y: -60, opacity: 0, duration: 0.8, ease: 'power3.out' });

  // ══════════════════════════════════════════════════════════════════
  // SESSION UI / CONTROLS
  // ══════════════════════════════════════════════════════════════════
  function updateNavSession(rawId) {
    const displayId = sessionMasked ? maskId(rawId) : rawId;
    $('sessionDisplayId').textContent = displayId;
    $('sessionPill').classList.remove('hidden');
    $('sessionPill').classList.add('flex');
    $('disconnectBtn').classList.remove('hidden');
  }

  function clearNavSession() {
    $('sessionPill').classList.add('hidden');
    $('sessionPill').classList.remove('flex');
    $('disconnectBtn').classList.add('hidden');
  }

  function maskId(id) {
    if (id.length <= 8) return '••••••••';
    return id.substring(0, 4) + '••••' + id.substring(id.length - 4);
  }

  $('toggleSessionVis').addEventListener('click', (e) => {
    e.stopPropagation();
    sessionMasked = !sessionMasked;
    const rawId = AuthModel.getClipboardId();
    if (rawId) {
      $('sessionDisplayId').textContent = sessionMasked ? maskId(rawId) : rawId;
      $('toggleSessionVis').innerHTML = sessionMasked
        ? `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`
        : `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>`;
    }
  });

  $('copySessionBtn').addEventListener('click', async (e) => {
    e.stopPropagation();
    const rawId = AuthModel.getClipboardId();
    if (rawId) {
      await copyToClipboard(rawId);
      showToast('Session ID copied to clipboard!', 'success');
    }
  });

  $('disconnectBtn').addEventListener('click', () => {
    AuthModel.clearSession();
    allClips = [];
    clipsGrid.innerHTML = '';
    showToast('Session disconnected', 'info');
  });

  // Session ID connection form submit
  $('sessionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = $('sessionInput').value.trim();
    $('sessionError').classList.add('hidden');
    $('connectSessionBtn').disabled = true;
    $('connectSessionBtn').innerHTML = '<span class="spinner inline-block"></span> Connecting…';

    try {
      await AuthModel.setClipboardId(id);
      showToast('Session connected!', 'success');
    } catch (err) {
      $('sessionError').textContent = err.message;
      $('sessionError').classList.remove('hidden');
      gsap.fromTo($('sessionError'), { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(4, 0.3)' });
    } finally {
      $('connectSessionBtn').disabled = false;
      $('connectSessionBtn').textContent = 'Connect Session';
    }
  });

  // Session ID generator
  $('generateSessionIdBtn').addEventListener('click', () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const randomBlock = () => Array.from(crypto.getRandomValues(new Uint8Array(4))).map(b => chars[b % chars.length]).join('');
    const generatedId = `facility-clip-${randomBlock()}-${randomBlock()}-${randomBlock()}`;
    
    $('sessionInput').value = generatedId;
    $('sessionInput').type = 'text'; // Make it visible
    $('toggleSessionInputVis').innerHTML = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>`;
    
    showToast('Secure random ID generated!', 'info');
  });

  // ══════════════════════════════════════════════════════════════════
  // CLIPBOARD UI / CRUD
  // ══════════════════════════════════════════════════════════════════

  // Load clips from Firestore
  async function loadClips() {
    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    try {
      const rawId = AuthModel.getClipboardId();
      const hashedId = AuthModel.getHashedId();
      allClips = await ClipboardModel.getClips(rawId, hashedId);
      renderClips(allClips);
    } catch (e) {
      console.error('loadClips error:', e);
      if (e.message && e.message.includes('index')) {
        showToast('⚠️ Firestore ต้องสร้าง Index ก่อน — กด link ใน Console (F12) เพื่อสร้าง', 'error', 10000);
      } else if (e.message && e.message.includes('permission')) {
        showToast('⚠️ Permission denied — ตรวจสอบ Firestore Security Rules', 'error', 10000);
      } else {
        showToast('Error loading clips: ' + e.message, 'error');
      }
    } finally {
      loadingState.classList.add('hidden');
    }
  }

  // Render clips grid
  function renderClips(clips) {
    const search = $('searchInput').value.trim();
    const lang   = $('filterLang').value;

    let filtered = ClipboardModel.searchClips(clips, search);
    if (lang) filtered = filtered.filter(c => c.language === lang);

    $('clipCount').textContent = filtered.length;

    if (filtered.length === 0) {
      clipsGrid.innerHTML = '';
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
      clipsGrid.innerHTML = filtered.map(buildClipCard).join('');
      gsap.fromTo('.clip-card', { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.4, ease: 'power2.out' });
      attachCardListeners();
    }
  }

  // Search / filter
  $('searchInput').addEventListener('input', () => renderClips(allClips));
  $('filterLang').addEventListener('change', () => renderClips(allClips));

  // Card event delegation
  function attachCardListeners() {
    clipsGrid.querySelectorAll('.clip-card').forEach(card => {
      const id = card.dataset.id;
      card.addEventListener('click', (e) => {
        if (e.target.closest('.quick-copy, .quick-edit, .quick-delete')) return;
        openViewModal(id);
      });
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter') openViewModal(id); });
    });

    // Quick actions
    clipsGrid.querySelectorAll('.quick-copy').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const clip = allClips.find(c => c.id === btn.dataset.id);
        if (!clip) return;
        if (clip.hasPassword) { showToast('Unlock in full view to copy password-protected clip', 'warn'); return; }
        await copyToClipboard(clip.content);
      });
    });

    clipsGrid.querySelectorAll('.quick-edit').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); openEditModal(btn.dataset.id); });
    });

    clipsGrid.querySelectorAll('.quick-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await deleteClip(btn.dataset.id);
      });
    });
  }

  // ── NEW CLIP MODAL ────────────────────────────────────────────────
  function openNewModal() {
    if (!currentUser) { showAuthPrompt(); return; }
    editingClip = null;
    $('clipModalTitle').textContent = 'New Clip';
    $('clipId').value = '';
    $('clipTitleInput').value = '';
    $('clipContentInput').value = '';
    $('clipLangInput').value = 'plain';
    $('clipExpireInput').value = '';
    $('clipExpireCustomField').classList.add('hidden');
    $('clipPublicToggle').checked = false;
    $('clipPublicToggle').dispatchEvent(new Event('change'));
    $('clipPasswordToggle').checked = false;
    $('clipPasswordToggle').dispatchEvent(new Event('change'));
    $('clipPasswordInput').value = '';
    $('clipError').classList.add('hidden');
    $('charCounter').textContent = '0';

    clipModal.classList.remove('hidden');
    gsap.fromTo(clipModal.querySelector('.modal-box'), { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' });
    setTimeout(() => $('clipTitleInput').focus(), 400);
  }

  function openEditModal(id) {
    if (!currentUser) { showAuthPrompt(); return; }
    const clip = allClips.find(c => c.id === id);
    if (!clip) return;
    editingClip = clip;
    $('clipModalTitle').textContent = 'Edit Clip';
    $('clipId').value = clip.id;
    $('clipTitleInput').value = clip.title;
    $('clipContentInput').value = clip.hasPassword ? '' : clip.content;
    $('clipLangInput').value = clip.language || 'plain';
    $('charCounter').textContent = (clip.hasPassword ? 0 : clip.content.length).toString();
    $('clipError').classList.add('hidden');

    // Set custom/normal expiry
    if (clip.expiresAt) {
      const date = clip.expiresAt.toDate ? clip.expiresAt.toDate() : new Date(clip.expiresAt);
      $('clipExpireInput').value = 'custom';
      $('clipExpireCustomField').classList.remove('hidden');
      const pad = n => String(n).padStart(2, '0');
      const isoStr = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
      $('clipExpireCustomInput').value = isoStr;
    } else {
      $('clipExpireInput').value = '';
      $('clipExpireCustomField').classList.add('hidden');
    }

    // Set public toggle
    $('clipPublicToggle').checked = clip.isPublic;
    $('clipPublicToggle').dispatchEvent(new Event('change'));

    // Password
    $('clipPasswordToggle').checked = clip.hasPassword;
    $('clipPasswordToggle').dispatchEvent(new Event('change'));
    $('clipPasswordInput').value = '';

    clipModal.classList.remove('hidden');
    gsap.fromTo(clipModal.querySelector('.modal-box'), { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' });
  }

  $('newClipBtn').addEventListener('click', openNewModal);
  $('closeClipModal').addEventListener('click', () => closeModal(clipModal));
  $('cancelClipBtn').addEventListener('click', () => closeModal(clipModal));

  // Char counter
  $('clipContentInput').addEventListener('input', () => {
    $('charCounter').textContent = $('clipContentInput').value.length;
  });

  // Clip form submit
  $('clipForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id       = $('clipId').value;
    const title    = $('clipTitleInput').value.trim();
    const content  = $('clipContentInput').value;
    const language = $('clipLangInput').value;
    const expireVal = $('clipExpireInput').value;
    const isPublic = $('clipPublicToggle').checked;
    const hasClipPw = $('clipPasswordToggle').checked;
    const clipPassword = hasClipPw ? $('clipPasswordInput').value : null;

    $('clipError').classList.add('hidden');

    if (!content.trim()) {
      $('clipError').textContent = 'Content cannot be empty.';
      $('clipError').classList.remove('hidden');
      return;
    }
    if (hasClipPw && (!clipPassword || clipPassword.length < 4)) {
      $('clipError').textContent = 'Clip password must be at least 4 characters.';
      $('clipError').classList.remove('hidden');
      return;
    }
    if (expireVal === 'custom') {
      const customVal = $('clipExpireCustomInput').value;
      if (!customVal) {
        $('clipError').textContent = 'Please select a custom expiration date and time.';
        $('clipError').classList.remove('hidden');
        return;
      }
      const customDate = new Date(customVal);
      if (customDate <= new Date()) {
        $('clipError').textContent = 'Expiration time must be in the future.';
        $('clipError').classList.remove('hidden');
        return;
      }
    }

    const saveBtn = $('saveClipBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner inline-block"></span> Encrypting…';

    try {
      const expiresAt = expiryValueToDate(expireVal);
      const payload = { title, content, language, isPublic, expiresAt, clipPassword };

      let result;
      const rawId = AuthModel.getClipboardId();
      const hashedId = AuthModel.getHashedId();
      if (id) {
        result = await ClipboardModel.updateClip(id, payload, rawId, hashedId);
        const idx = allClips.findIndex(c => c.id === id);
        if (idx !== -1) allClips[idx] = { ...allClips[idx], ...result };
        showToast('Clip updated & encrypted ✓', 'success');
      } else {
        result = await ClipboardModel.createClip(payload, rawId, hashedId);
        allClips.unshift(result);
        showToast('Clip saved & encrypted ✓', 'success');
      }

      closeModal(clipModal);
      renderClips(allClips);
    } catch (err) {
      $('clipError').textContent = err.message;
      $('clipError').classList.remove('hidden');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg> Save (Encrypted)`;
    }
  });

  // ── VIEW CLIP MODAL ───────────────────────────────────────────────
  function openViewModal(id) {
    viewingClip = allClips.find(c => c.id === id);
    if (!viewingClip) return;
    unlockedContent = null;

    $('viewClipTitle').textContent = viewingClip.title;
    const langBadge = $('viewLangBadge');
    langBadge.textContent = viewingClip.language || 'plain';
    langBadge.className = 'lang-badge ' + getLangClass(viewingClip.language);

    // Expiry
    const expBadge = $('viewExpireBadge');
    if (viewingClip.expiresAt) {
      expBadge.classList.remove('hidden');
      expBadge.textContent = formatExpiry(viewingClip.expiresAt);
    } else {
      expBadge.classList.add('hidden');
    }

    // Password
    const pwForm = $('viewPasswordForm');
    const contentEl = $('viewClipContent');
    $('viewPasswordInput').value = '';

    if (viewingClip.hasPassword) {
      pwForm.classList.remove('hidden');
      contentEl.textContent = '[ Encrypted — enter password to view ]';
    } else {
      pwForm.classList.add('hidden');
      contentEl.textContent = viewingClip.content || '';
      unlockedContent = viewingClip.content;
    }

    viewModal.classList.remove('hidden');
    gsap.fromTo(viewModal.querySelector('.modal-box'), { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' });
  }

  $('closeViewModal').addEventListener('click', () => closeModal(viewModal));

  // Unlock password clip
  $('viewUnlockBtn').addEventListener('click', async () => {
    const pw = $('viewPasswordInput').value;
    if (!pw) return;
    const btn = $('viewUnlockBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner inline-block"></span>';
    try {
      // If encryptedContent is missing (e.g. clip was just created), fetch fresh from Firestore
      let encrypted = viewingClip.encryptedContent;
      if (!encrypted) {
        const rawId = AuthModel.getClipboardId();
        const hashedId = AuthModel.getHashedId();
        const fresh = await ClipboardModel.getClip(viewingClip.id, rawId, hashedId);
        encrypted = fresh.encryptedContent;
        viewingClip.encryptedContent = encrypted; // Cache it
        // Also update allClips
        const idx = allClips.findIndex(c => c.id === viewingClip.id);
        if (idx !== -1) allClips[idx].encryptedContent = encrypted;
      }
      const plain = await ClipboardModel.unlockClip(encrypted, pw);
      unlockedContent = plain;
      $('viewClipContent').textContent = plain;
      $('viewPasswordForm').classList.add('hidden');
      showToast('Decrypted ✓', 'success');
    } catch (e) {
      showToast('Wrong password — ' + e.message, 'error');
      gsap.fromTo($('viewPasswordInput'), { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(4, 0.3)' });
    } finally {
      btn.disabled = false;
      btn.textContent = 'Unlock';
    }
  });

  $('viewPasswordInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('viewUnlockBtn').click();
  });

  // Copy
  $('viewCopyBtn').addEventListener('click', async () => {
    if (!unlockedContent) { showToast('Unlock clip first', 'warn'); return; }
    await copyToClipboard(unlockedContent);
  });

  // Edit
  $('viewEditBtn').addEventListener('click', () => {
    closeModal(viewModal);
    openEditModal(viewingClip.id);
  });

  // Share
  $('viewShareBtn').addEventListener('click', async () => {
    if (!viewingClip.isPublic) {
      // Enable sharing first
      try {
        const rawId = AuthModel.getClipboardId();
        const encryptedContent = await ClipboardModel.togglePublic(viewingClip.id, true, viewingClip.content, rawId);
        viewingClip.isPublic = true;
        viewingClip.encryptedContent = encryptedContent;
        const idx = allClips.findIndex(c => c.id === viewingClip.id);
        if (idx !== -1) {
          allClips[idx].isPublic = true;
          allClips[idx].content = viewingClip.content; // plain
        }
        renderClips(allClips);
      } catch (e) {
        showToast('Failed to enable sharing', 'error');
        return;
      }
    }
    const shareUrl = `${location.origin}${location.pathname}?share=${viewingClip.shareId}`;
    await copyToClipboard(shareUrl);
    showToast('Share link copied!', 'success');
  });

  // Delete
  $('viewDeleteBtn').addEventListener('click', async () => {
    if (!viewingClip) return;
    await deleteClip(viewingClip.id);
    closeModal(viewModal);
  });

  // ── DELETE ────────────────────────────────────────────────────────
  async function deleteClip(id) {
    try {
      await ClipboardModel.deleteClip(id);
      allClips = allClips.filter(c => c.id !== id);
      renderClips(allClips);
      showToast('Clip deleted', 'info');
    } catch (e) {
      showToast('Delete failed: ' + e.message, 'error');
    }
  }

  // ── COPY HELPER ───────────────────────────────────────────────────
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!', 'success');
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      showToast('Copied!', 'success');
    }
  }

  // ── CLOSE MODAL ───────────────────────────────────────────────────
  function closeModal(modal) {
    gsap.to(modal.querySelector('.modal-box'), {
      scale: 0.9, opacity: 0, duration: 0.25, ease: 'power2.in',
      onComplete: () => modal.classList.add('hidden')
    });
  }

  // Close on overlay click
  [clipModal, viewModal].forEach(modal => {
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
  });

  // ── KEYBOARD SHORTCUTS ────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!clipModal.classList.contains('hidden')) closeModal(clipModal);
      else if (!viewModal.classList.contains('hidden')) closeModal(viewModal);
    }
  });

  // ── AUTH PROMPT (for unauthenticated users) ───────────────────────
  function showAuthPrompt() {
    if (!AuthModel.getClipboardId()) {
      appView.classList.add('hidden');
      sessionView.classList.remove('hidden');
      $('sessionInput').focus();
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // SHARE VIEW LOGIC
  // ══════════════════════════════════════════════════════════════════
  async function loadShareView(shareId) {
    const titleEl   = $('shareTitle');
    const contentEl = $('shareContent');
    const copyBtn   = $('shareCopyBtn');

    titleEl.textContent = 'Loading…';
    let sharedClip, encContent;

    try {
      sharedClip = await ClipboardModel.getSharedClip(shareId);
      titleEl.textContent = sharedClip.title;

      // Lang badge
      const lb = $('shareLangBadge');
      lb.textContent = sharedClip.language || 'plain';
      lb.className = 'lang-badge ' + getLangClass(sharedClip.language);

      // Expiry
      $('shareExpiry').textContent = sharedClip.expiresAt ? formatExpiry(sharedClip.expiresAt) : '';

      if (sharedClip.hasPassword) {
        // Password-protected
        encContent = sharedClip.content;
        $('sharePasswordForm').classList.remove('hidden');

        $('shareUnlockBtn').addEventListener('click', async () => {
          const pw = $('sharePasswordInput').value;
          if (!pw) return;
          try {
            const plain = await ClipboardModel.unlockClip(encContent, pw);
            contentEl.textContent = plain;
            contentEl.classList.remove('hidden');
            copyBtn.classList.remove('hidden');
            $('sharePasswordForm').classList.add('hidden');
            copyBtn.addEventListener('click', () => copyToClipboard(plain));
          } catch {
            showToast('Wrong password', 'error');
          }
        });
      } else {
        // Public clip — content is decrypted / plaintext
        contentEl.textContent = sharedClip.content;
        contentEl.classList.remove('hidden');
        copyBtn.classList.remove('hidden');
        copyBtn.addEventListener('click', () => copyToClipboard(sharedClip.content));
      }

      gsap.from('#shareView .glass-strong', { y: 30, opacity: 0, duration: 0.6, ease: 'power3.out' });
    } catch (e) {
      titleEl.textContent = 'Clip not found';
      contentEl.textContent = e.message;
      contentEl.classList.remove('hidden');
    }
  }

});

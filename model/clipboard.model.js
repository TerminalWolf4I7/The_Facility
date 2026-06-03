// ================================================================
// clipboard.model.js — Firestore CRUD with Client-Side Encryption
// ================================================================
// All clip content is encrypted BEFORE hitting Firestore unless
// it is explicitly marked as public (shareable) without a password.
// Firestore only stores ciphertext — even Firebase admins can't read it.
// ================================================================

const ClipboardModel = (() => {
  // ----------------------------------------------------------------
  // Helpers: generate a short random share token
  // ----------------------------------------------------------------
  function _genShareId(len = 12) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    return Array.from(crypto.getRandomValues(new Uint8Array(len)))
      .map(b => chars[b % chars.length])
      .join('');
  }

  // ----------------------------------------------------------------
  // CREATE a new clip (encrypted)
  // ----------------------------------------------------------------
  async function createClip({ title, content, language = 'plain', isPublic = false, expiresAt = null, clipPassword = null }, rawId, hashedId) {
    const { collection, addDoc, Timestamp } =
      await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

    const db = AuthModel.getDb();

    // Encrypt content
    let encryptedContent;
    if (clipPassword) {
      encryptedContent = await CryptoModel.encryptWithPassword(content, clipPassword);
    } else if (isPublic) {
      // If it's a public clip and not password-protected, store as plaintext so anyone can view it
      encryptedContent = content;
    } else {
      encryptedContent = await CryptoModel.encrypt(content, rawId);
    }

    const shareId = _genShareId();
    const now = Timestamp.now();

    const clipData = {
      userId: hashedId,                 // Query index is the SHA-256 hash of the ID
      title: title.trim() || 'Untitled Clip',
      content: encryptedContent,       // Ciphertext (or plaintext if public)
      language,
      isPublic,
      hasPassword: !!clipPassword,
      shareId,
      createdAt: now,
      updatedAt: now,
      expiresAt: expiresAt ? Timestamp.fromDate(new Date(expiresAt)) : null,
      charCount: content.length,
    };

    const ref = await addDoc(collection(db, 'clips'), clipData);
    return { id: ref.id, ...clipData, content, encryptedContent }; // Return with decrypted content + raw encrypted for unlock
  }

  // ----------------------------------------------------------------
  // READ all clips for a user (decrypt on fetch)
  // ----------------------------------------------------------------
  async function getClips(rawId, hashedId) {
    const { collection, query, where, getDocs } =
      await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

    const db = AuthModel.getDb();
    // Only filter by userId — no orderBy to avoid requiring a composite index
    const q = query(
      collection(db, 'clips'),
      where('userId', '==', hashedId)
    );

    const snapshot = await getDocs(q);
    const clips = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Check expiry
      if (data.expiresAt) {
        const expiryDate = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
        if (expiryDate < new Date()) {
          // Expired - delete from Firestore in the background and skip rendering
          deleteClip(doc.id).catch(err => console.error('Failed to auto-delete expired clip:', err));
          continue;
        }
      }

      let decryptedContent = '[Encrypted — click to view]';

      // Only decrypt non-password clips automatically
      if (!data.hasPassword) {
        try {
          if (data.isPublic) {
            decryptedContent = data.content; // Already plaintext
          } else {
            decryptedContent = await CryptoModel.decrypt(data.content, rawId);
          }
        } catch {
          decryptedContent = '[Decryption error]';
        }
      }

      clips.push({
        id: doc.id,
        ...data,
        content: decryptedContent,
        encryptedContent: data.content,
      });
    }

    // Sort client-side: newest first by updatedAt
    clips.sort((a, b) => {
      const ta = a.updatedAt?.toMillis?.() || a.updatedAt?.seconds * 1000 || 0;
      const tb = b.updatedAt?.toMillis?.() || b.updatedAt?.seconds * 1000 || 0;
      return tb - ta;
    });

    return clips;
  }

  // ----------------------------------------------------------------
  // READ a single clip (by doc ID) — full decrypt
  // ----------------------------------------------------------------
  async function getClip(clipId, rawId, hashedId) {
    const { doc, getDoc } =
      await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

    const db = AuthModel.getDb();
    const snap = await getDoc(doc(db, 'clips', clipId));
    if (!snap.exists()) throw new Error('Clip not found.');

    const data = snap.data();
    if (data.userId !== hashedId) throw new Error('Access denied.');

    let content;
    if (data.hasPassword) {
      content = '[Password protected — enter password to view]';
    } else if (data.isPublic) {
      content = data.content;
    } else {
      content = await CryptoModel.decrypt(data.content, rawId);
    }

    return { id: snap.id, ...data, content, encryptedContent: data.content };
  }

  // ----------------------------------------------------------------
  // Unlock a password-protected clip
  // ----------------------------------------------------------------
  async function unlockClip(encryptedContent, clipPassword) {
    return CryptoModel.decryptWithPassword(encryptedContent, clipPassword);
  }

  // ----------------------------------------------------------------
  // UPDATE a clip
  // ----------------------------------------------------------------
  async function updateClip(clipId, { title, content, language, isPublic, expiresAt, clipPassword }, rawId, hashedId) {
    const { doc, updateDoc, Timestamp } =
      await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

    const db = AuthModel.getDb();

    let encryptedContent;
    if (clipPassword) {
      encryptedContent = await CryptoModel.encryptWithPassword(content, clipPassword);
    } else if (isPublic) {
      encryptedContent = content; // Store as plaintext if public
    } else {
      encryptedContent = await CryptoModel.encrypt(content, rawId);
    }

    const updates = {
      title: title.trim() || 'Untitled Clip',
      content: encryptedContent,
      language,
      isPublic,
      hasPassword: !!clipPassword,
      updatedAt: Timestamp.now(),
      charCount: content.length,
    };

    if (expiresAt !== undefined) {
      updates.expiresAt = expiresAt ? Timestamp.fromDate(new Date(expiresAt)) : null;
    }

    await updateDoc(doc(db, 'clips', clipId), updates);
    return { id: clipId, ...updates, content, encryptedContent }; // Return with decrypted content + raw encrypted for unlock
  }

  // ----------------------------------------------------------------
  // DELETE a clip
  // ----------------------------------------------------------------
  async function deleteClip(clipId) {
    const { doc, deleteDoc } =
      await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

    const db = AuthModel.getDb();
    await deleteDoc(doc(db, 'clips', clipId));
  }

  // ----------------------------------------------------------------
  // GET shared clip (public)
  // ----------------------------------------------------------------
  async function getSharedClip(shareId) {
    const { collection, query, where, getDocs } =
      await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

    const db = AuthModel.getDb();
    const q = query(collection(db, 'clips'), where('shareId', '==', shareId), where('isPublic', '==', true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) throw new Error('Shared clip not found or not public.');

    const data = snapshot.docs[0].data();

    // Check expiry
    if (data.expiresAt) {
      const expiryDate = data.expiresAt.toDate();
      if (expiryDate < new Date()) throw new Error('This clip has expired.');
    }

    return {
      id: snapshot.docs[0].id,
      ...data,
      content: data.hasPassword ? null : data.content, // Don't expose encrypted content if password-protected
    };
  }

  // ----------------------------------------------------------------
  // Decrypt a shared clip with a password
  // ----------------------------------------------------------------
  async function decryptSharedClip(encryptedContent, password) {
    return CryptoModel.decryptWithPassword(encryptedContent, password);
  }

  // ----------------------------------------------------------------
  // SEARCH clips (client-side, after fetch)
  // ----------------------------------------------------------------
  function searchClips(clips, query) {
    const q = query.toLowerCase().trim();
    if (!q) return clips;
    return clips.filter(c =>
      c.title.toLowerCase().includes(q) ||
      (c.content && !c.hasPassword && c.content.toLowerCase().includes(q)) ||
      c.language.toLowerCase().includes(q)
    );
  }

  // ----------------------------------------------------------------
  // Toggle isPublic on a clip
  // ----------------------------------------------------------------
  async function togglePublic(clipId, isPublic, content, rawId) {
    const { doc, updateDoc, Timestamp } =
      await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

    const db = AuthModel.getDb();
    
    // If it's being made public, store content as plaintext; otherwise encrypt it
    let encryptedContent = content;
    if (!isPublic) {
      encryptedContent = await CryptoModel.encrypt(content, rawId);
    }
    
    await updateDoc(doc(db, 'clips', clipId), {
      isPublic,
      content: encryptedContent,
      updatedAt: Timestamp.now()
    });
    
    return encryptedContent;
  }

  return {
    createClip, getClips, getClip, updateClip, deleteClip,
    getSharedClip, decryptSharedClip, unlockClip,
    searchClips, togglePublic,
  };
})();

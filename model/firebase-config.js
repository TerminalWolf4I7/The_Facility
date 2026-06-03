// ================================================================
// Firebase Configuration
// ================================================================
// SETUP INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (or use existing)
// 3. Go to Project Settings > General > Your apps > Web app
// 4. Copy your config and replace the values below
// 5. Create Firestore Database (start in test/production mode)
// 6. Apply Firestore Security Rules from the comment below (Rules tab)
// ================================================================

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA8AOcGCnVlv0yu31x9haimAbj2nC6jswU",
  authDomain: "online-clipboard-c0362.firebaseapp.com",
  projectId: "online-clipboard-c0362",
  storageBucket: "online-clipboard-c0362.firebasestorage.app",
  messagingSenderId: "815756074049",
  appId: "1:815756074049:web:ac2bdef56e9da7a827fac0"
};

// ================================================================
// FIRESTORE SECURITY RULES
// Copy & paste these rules into Firebase Console > Firestore > Rules tab
// ================================================================
// ⚠️ IMPORTANT: เนื่องจากระบบนี้ใช้ Clipboard ID (ไม่ใช้ Firebase Auth)
//    จึงไม่มี request.auth ให้ตรวจสอบ → ความปลอดภัยหลักมาจาก:
//    1. Client-side AES-256-GCM encryption (Zero-Knowledge)
//    2. SHA-256 hash ของ Clipboard ID เป็น userId (ไม่สามารถ reverse ได้)
//    3. Firestore เก็บแค่ ciphertext — แม้อ่านได้ก็ถอดรหัสไม่ได้
// ================================================================
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Clips collection — zero-knowledge encrypted data
    match /clips/{clipId} {

      // ── READ ──────────────────────────────────────────────────
      // get (single doc by ID): อนุญาต — ต้องรู้ doc ID ถึงอ่านได้
      //   → จำเป็นสำหรับ share links และ unlock password clips
      allow get: if true;

      // list (query): อนุญาต — query ต้องมี where('userId', '==', ...) อยู่แล้ว
      //   → ไม่มี Firebase Auth จึงล็อคเพิ่มไม่ได้ แต่ข้อมูลเป็น ciphertext ทั้งหมด
      allow list: if true;

      // ── CREATE ────────────────────────────────────────────────
      // ต้องมี field ครบ + ขนาดไม่เกินกำหนด
      allow create: if request.resource.data.keys().hasAll([
                         'userId', 'title', 'content', 'language',
                         'isPublic', 'hasPassword', 'shareId',
                         'createdAt', 'updatedAt', 'charCount'
                       ])
                    && request.resource.data.userId is string
                    && request.resource.data.userId.size() == 64    // SHA-256 hex = 64 chars
                    && request.resource.data.content is string
                    && request.resource.data.content.size() <= 500000  // 500KB max
                    && request.resource.data.title is string
                    && request.resource.data.title.size() <= 200       // Title max 200 chars
                    && request.resource.data.charCount is int
                    && request.resource.data.charCount <= 500000;

      // ── UPDATE ────────────────────────────────────────────────
      // ห้ามเปลี่ยน userId (ป้องกัน hijack clip)
      // content ต้องไม่เกิน 500KB
      allow update: if request.resource.data.userId == resource.data.userId
                    && request.resource.data.content is string
                    && request.resource.data.content.size() <= 500000
                    && request.resource.data.title.size() <= 200;

      // ── DELETE ────────────────────────────────────────────────
      // ⚠️ ข้อจำกัด: ไม่มี Firebase Auth จึงไม่สามารถตรวจสอบตัวตนผู้ลบได้
      //    ความปลอดภัย: ต้องรู้ doc ID (random) ถึงลบได้
      //    ข้อมูลเป็น ciphertext อยู่แล้ว → ลบไปก็ไม่ได้ข้อมูลอะไร
      allow delete: if true;
    }

    // Deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
*/



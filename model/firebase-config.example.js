// ================================================================
// Firebase Configuration — EXAMPLE TEMPLATE
// ================================================================
// ⚠️  อย่า commit "firebase-config.js" จริง ขึ้น GitHub!
//     ไฟล์นี้คือ template เท่านั้น — ถูก ignore โดย .gitignore
// ================================================================
//
// SETUP INSTRUCTIONS:
// 1. Copy ไฟล์นี้แล้วเปลี่ยนชื่อเป็น  model/firebase-config.js
// 2. Go to https://console.firebase.google.com
// 3. Project Settings → General → Your apps → Web app
// 4. Copy config และแทนที่ค่า YOUR_xxx ด้านล่าง
// 5. สร้าง Firestore Database และ apply Security Rules จาก README
// ================================================================

const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// ================================================================
// FIRESTORE SECURITY RULES
// Copy & paste ใน Firebase Console → Firestore → Rules tab
// ================================================================
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Clips collection — zero-knowledge encrypted data
    match /clips/{clipId} {
      allow get: if true;
      allow list: if request.query.limit <= 100;

      allow create: if request.resource.data.keys().hasAll([
                         'userId', 'title', 'content', 'language',
                         'isPublic', 'hasPassword', 'shareId',
                         'createdAt', 'updatedAt', 'charCount'
                       ])
                    && request.resource.data.userId is string
                    && request.resource.data.userId.size() == 64
                    && request.resource.data.content is string
                    && request.resource.data.content.size() <= 500000
                    && request.resource.data.title is string
                    && request.resource.data.title.size() <= 200
                    && request.resource.data.charCount is int
                    && request.resource.data.charCount <= 500000;

      allow update: if request.resource.data.userId == resource.data.userId
                    && request.resource.data.content is string
                    && request.resource.data.content.size() <= 500000
                    && request.resource.data.title.size() <= 200;

      allow delete: if resource.data.userId is string
                    && resource.data.userId.size() == 64;
    }

    // Deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
*/

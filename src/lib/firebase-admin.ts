import * as admin from "firebase-admin";

// Global in-memory storage to survive hot reloads during local development
const globalMockDb = global as any;
if (!globalMockDb.mockClips) {
  globalMockDb.mockClips = new Map<string, any>();
}
const mockClips: Map<string, any> = globalMockDb.mockClips;

class MockDocSnapshot {
  id: string;
  _data: any;
  exists: boolean;

  constructor(id: string, data: any) {
    this.id = id;
    this._data = data;
    this.exists = !!data;
  }

  data() {
    return this._data;
  }
}

class MockQuerySnapshot {
  docs: MockDocSnapshot[];
  empty: boolean;

  constructor(docs: MockDocSnapshot[]) {
    this.docs = docs;
    this.empty = docs.length === 0;
  }
}

class MockDocReference {
  id: string;
  collectionName: string;

  constructor(id: string, collectionName: string) {
    this.id = id;
    this.collectionName = collectionName;
  }

  async get() {
    const data = mockClips.get(this.id);
    return new MockDocSnapshot(this.id, data);
  }

  async update(newData: any) {
    const existing = mockClips.get(this.id) || {};
    const converted = { ...newData };
    for (const key in converted) {
      if (converted[key] instanceof Date) {
        const d = converted[key];
        converted[key] = { toDate: () => d };
      }
    }
    mockClips.set(this.id, {
      ...existing,
      ...converted,
      updatedAt: { toDate: () => new Date() }
    });
  }

  async delete() {
    mockClips.delete(this.id);
  }
}

class MockCollectionReference {
  name: string;
  _queries: Array<{ field: string; op: string; value: any }> = [];

  constructor(name: string) {
    this.name = name;
  }

  where(field: string, op: string, value: any) {
    const col = new MockCollectionReference(this.name);
    col._queries = [...this._queries, { field, op, value }];
    return col;
  }

  doc(id: string) {
    return new MockDocReference(id, this.name);
  }

  async add(data: any) {
    const id = "mock_clip_" + Math.random().toString(36).substring(2, 15);
    const converted = { ...data };
    for (const key in converted) {
      if (converted[key] instanceof Date) {
        const d = converted[key];
        converted[key] = { toDate: () => d };
      }
    }
    mockClips.set(id, converted);
    return new MockDocReference(id, this.name);
  }

  async get() {
    let results = Array.from(mockClips.entries()).map(([id, val]) => {
      return new MockDocSnapshot(id, val);
    });

    for (const q of this._queries) {
      results = results.filter((doc) => {
        const data = doc.data();
        if (!data) return false;
        const val = data[q.field];
        const rawVal = val && typeof val.toDate === "function" ? val.toDate() : val;
        
        if (q.op === "==") return rawVal === q.value;
        return true;
      });
    }

    return new MockQuerySnapshot(results);
  }
}

class MockFirestore {
  collection(name: string) {
    return new MockCollectionReference(name);
  }
}

export function getFirestore() {
  const projectId = process.env.FIREBASE_PROJECT_ID || "online-clipboard-c0362";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    if (admin.apps.length === 0) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, "\n").replace(/\"/g, ""), // also removing any rogue quotes
          }),
        });
        console.log("🔥 Firebase Admin SDK initialized successfully.");
      } catch (error) {
        console.error("⚠️ Firebase Admin SDK initialization failed (check your keys):", error);
        console.warn("⚠️ Falling back to local in-memory Mock Firestore.");
        return new MockFirestore() as any;
      }
    }
    return admin.firestore();
  } else {
    // Return mock database fallback for local dev when private keys are missing
    console.warn("⚠️ Firebase Admin SDK: private key is not configured. Falling back to local in-memory Mock Firestore.");
    return new MockFirestore() as any;
  }
}

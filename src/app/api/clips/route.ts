import { getFirestore } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";
import { z } from "zod";

// Input Validation Schema using Zod
const getQuerySchema = z.object({
  userId: z.string().length(64).regex(/^[a-fA-F0-9]+$/),
});

const postSchema = z.object({
  userId: z.string().length(64).regex(/^[a-fA-F0-9]+$/),
  title: z.string().max(200).transform(val => val.trim() || "Untitled Clip"),
  content: z.string().max(512000), // 500KB limit
  language: z.string().max(20).regex(/^[a-zA-Z0-9\-+]+$/).default("plain"),
  isPublic: z.boolean().default(false),
  hasPassword: z.boolean().default(false),
  expiresAt: z.string().nullable().optional(), // ISO String or null
});

// Helper: Generate a short secure random token
function generateShareId(len = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => chars[b % chars.length])
    .join("");
}

// GET /api/clips?userId=hash
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const parsed = getQuerySchema.safeParse({ userId });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid userId query parameter" }, { status: 400 });
    }

    const db = getFirestore();
    const snapshot = await db
      .collection("clips")
      .where("userId", "==", parsed.data.userId)
      .get();

    const clips: any[] = [];
    const now = new Date();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Handle auto-expire check
      if (data.expiresAt) {
        const expiryDate = data.expiresAt.toDate();
        if (expiryDate < now) {
          // Delete expired clip in the background
          db.collection("clips").doc(doc.id).delete().catch((e) => 
            console.error(`Failed to auto-delete expired clip ${doc.id}:`, e)
          );
          continue;
        }
      }

      clips.push({
        id: doc.id,
        title: data.title,
        content: data.content, // Ciphertext or plaintext (if public)
        language: data.language,
        isPublic: data.isPublic,
        hasPassword: data.hasPassword,
        shareId: data.shareId,
        createdAt: data.createdAt.toDate().toISOString(),
        updatedAt: data.updatedAt.toDate().toISOString(),
        expiresAt: data.expiresAt ? data.expiresAt.toDate().toISOString() : null,
        charCount: data.charCount,
      });
    }

    // Sort descending by updatedAt
    clips.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json(clips);
  } catch (error: any) {
    console.error("API GET Clips error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/clips
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { userId, title, content, language, isPublic, hasPassword, expiresAt } = parsed.data;

    // Secure HTML Sanitization of title
    const cleanTitle = title
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    const db = getFirestore();
    const shareId = generateShareId();
    const now = new Date();

    const clipDoc = {
      userId,
      title: cleanTitle,
      content,
      language,
      isPublic,
      hasPassword,
      shareId,
      createdAt: now,
      updatedAt: now,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      charCount: content.length,
    };

    const docRef = await db.collection("clips").add(clipDoc);

    return NextResponse.json({
      id: docRef.id,
      ...clipDoc,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    });
  } catch (error: any) {
    console.error("API POST Clips error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

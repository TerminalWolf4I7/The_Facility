import { getFirestore } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";
import { z } from "zod";

const ownershipSchema = z.object({
  userId: z.string().length(64).regex(/^[a-fA-F0-9]+$/),
});

const putSchema = z.object({
  userId: z.string().length(64).regex(/^[a-fA-F0-9]+$/),
  title: z.string().max(200).transform(val => val.trim() || "Untitled Clip"),
  content: z.string().max(512000),
  language: z.string().max(20).regex(/^[a-zA-Z0-9\-+]+$/).default("plain"),
  isPublic: z.boolean().default(false),
  hasPassword: z.boolean().default(false),
  expiresAt: z.string().nullable().optional(),
});

// GET /api/clips/[id]?userId=hash
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const parsed = ownershipSchema.safeParse({ userId });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid userId parameter" }, { status: 400 });
    }

    const db = getFirestore();
    const docRef = db.collection("clips").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    const data = docSnap.data()!;
    if (data.userId !== parsed.data.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check expiry
    if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
      await docRef.delete();
      return NextResponse.json({ error: "Clip expired" }, { status: 404 });
    }

    return NextResponse.json({
      id: docSnap.id,
      title: data.title,
      content: data.content,
      language: data.language,
      isPublic: data.isPublic,
      hasPassword: data.hasPassword,
      shareId: data.shareId,
      createdAt: data.createdAt.toDate().toISOString(),
      updatedAt: data.updatedAt.toDate().toISOString(),
      expiresAt: data.expiresAt ? data.expiresAt.toDate().toISOString() : null,
      charCount: data.charCount,
    });
  } catch (error) {
    console.error("API GET Clip by ID error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/clips/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = putSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { userId, title, content, language, isPublic, hasPassword, expiresAt } = parsed.data;

    const db = getFirestore();
    const docRef = db.collection("clips").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    const currentData = docSnap.data()!;
    if (currentData.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Secure HTML Sanitization of title
    const cleanTitle = title
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    const now = new Date();
    const updates: any = {
      title: cleanTitle,
      content,
      language,
      isPublic,
      hasPassword,
      updatedAt: now,
      charCount: content.length,
    };

    if (expiresAt !== undefined) {
      updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    await docRef.update(updates);

    return NextResponse.json({
      id,
      ...updates,
      updatedAt: now.toISOString(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    });
  } catch (error) {
    console.error("API PUT Clip error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/clips/[id]?userId=hash
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const parsed = ownershipSchema.safeParse({ userId });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid userId parameter" }, { status: 400 });
    }

    const db = getFirestore();
    const docRef = db.collection("clips").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    if (docSnap.data()!.userId !== parsed.data.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API DELETE Clip error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { getFirestore } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

// GET /api/clips/share/[shareId]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;

    const db = getFirestore();
    const snapshot = await db
      .collection("clips")
      .where("shareId", "==", shareId)
      .where("isPublic", "==", true)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ error: "Shared clip not found or not public" }, { status: 404 });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    const now = new Date();

    // Check expiry
    if (data.expiresAt) {
      const expiryDate = data.expiresAt.toDate();
      if (expiryDate < now) {
        // Delete expired clip in the background
        db.collection("clips").doc(doc.id).delete().catch((e) =>
          console.error(`Failed to auto-delete expired shared clip ${doc.id}:`, e)
        );
        return NextResponse.json({ error: "This clip has expired" }, { status: 404 });
      }
    }

    return NextResponse.json({
      id: doc.id,
      title: data.title,
      content: data.content, // Ciphertext or plaintext. Client decrypts it if password-protected.
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
    console.error("API GET Shared Clip error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

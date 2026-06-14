import { hashId, validateClipboardId } from "./security";

function obfuscate(text: string, key: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}

function deobfuscate(b64: string, key: string): string | null {
  try {
    const text = atob(b64);
    let result = "";
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return null;
  }
}

export interface SessionData {
  rawId: string;
  hashedId: string;
}

export async function getFingerprint(): Promise<string> {
  if (typeof window === "undefined") return "";
  return hashId(navigator.userAgent);
}

export async function saveSession(clipboardId: string): Promise<SessionData> {
  if (typeof window === "undefined") throw new Error("Browser environment required.");
  
  const cleanId = clipboardId.trim();
  if (!validateClipboardId(cleanId)) {
    throw new Error("รหัสคลิปบอร์ดไม่ถูกต้อง ต้องมีความยาว 6-256 ตัวอักษร และประกอบด้วยตัวภาษาอังกฤษ ตัวเลข ขีด (-) หรืออันเดอร์สกอร์ (_) เท่านั้น");
  }

  const hashedId = await hashId(cleanId);
  const fp = await getFingerprint();
  const encrypted = obfuscate(cleanId, fp);

  localStorage.setItem("the_facility_clipboard_id_enc", encrypted);
  localStorage.setItem("the_facility_clipboard_fp", fp);
  localStorage.setItem("the_facility_clipboard_last_active", Date.now().toString());

  return { rawId: cleanId, hashedId };
}

export async function restoreSession(): Promise<SessionData | null> {
  if (typeof window === "undefined") return null;

  const fp = await getFingerprint();
  const encryptedId = localStorage.getItem("the_facility_clipboard_id_enc");
  const storedFp = localStorage.getItem("the_facility_clipboard_fp");
  const lastActive = localStorage.getItem("the_facility_clipboard_last_active");

  if (!encryptedId || storedFp !== fp || !lastActive) {
    clearSession();
    return null;
  }

  const now = Date.now();
  const diff = now - parseInt(lastActive, 10);
  if (diff > 86400000) { // 24 hours expiration
    clearSession();
    return null;
  }

  const decrypted = deobfuscate(encryptedId, fp);
  if (decrypted && validateClipboardId(decrypted)) {
    localStorage.setItem("the_facility_clipboard_last_active", now.toString()); // Update activity timestamp
    const hashedId = await hashId(decrypted);
    return { rawId: decrypted, hashedId };
  } else {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("the_facility_clipboard_id_enc");
  localStorage.removeItem("the_facility_clipboard_fp");
  localStorage.removeItem("the_facility_clipboard_last_active");
  localStorage.removeItem("the_facility_clipboard_id"); // old legacy key
}

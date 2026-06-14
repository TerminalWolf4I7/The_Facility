"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Lock, Copy, ShieldAlert, FileText, Calendar } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Navbar from "@/components/ui/Navbar";
import { useToast } from "@/components/ui/Toast";
import { decryptWithPassword } from "@/lib/crypto";

interface SharedClip {
  id: string;
  title: string;
  content: string; // Plaintext or ciphertext
  language: string;
  isPublic: boolean;
  hasPassword: boolean;
  shareId: string;
  createdAt: string;
  expiresAt: string | null;
}

export default function ShareViewPage() {
  const { shareId } = useParams();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [clip, setClip] = useState<SharedClip | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Password Decryption
  const [password, setPassword] = useState("");
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);

  useEffect(() => {
    if (!shareId) return;

    const fetchSharedClip = async () => {
      try {
        const res = await fetch(`/api/clips/share/${shareId}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Shared clip not found.");
        }
        const data = await res.json();
        setClip(data);
        if (!data.hasPassword) {
          setDecryptedContent(data.content);
        }
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedClip();
  }, [shareId]);

  const handleUnlock = async () => {
    if (!clip || !password) return;
    try {
      const plain = await decryptWithPassword(clip.content, password);
      setDecryptedContent(plain);
      setPassword("");
      showToast("ถอดรหัสสำเร็จ", "success");
    } catch {
      showToast("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง", "error");
    }
  };

  const handleCopy = () => {
    if (!decryptedContent) return;
    navigator.clipboard.writeText(decryptedContent)
      .then(() => showToast("คัดลอกข้อความสำเร็จ!"))
      .catch(() => showToast("ไม่สามารถคัดลอกข้อความได้", "error"));
  };

  const getLangClass = (lang: string) => {
    const map: Record<string, string> = {
      javascript: "border-yellow-400/20 text-yellow-400 bg-yellow-500/10",
      python: "border-blue-400/20 text-blue-400 bg-blue-500/10",
      html: "border-red-400/20 text-red-400 bg-red-500/10",
      css: "border-indigo-400/20 text-indigo-400 bg-indigo-500/10",
      json: "border-emerald-400/20 text-emerald-400 bg-emerald-500/10",
      sql: "border-orange-400/20 text-orange-400 bg-orange-500/10",
    };
    return map[lang] || "border-slate-500/20 text-slate-300 bg-slate-500/10";
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col justify-between select-none">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="max-w-2xl mx-auto pt-28 pb-16 px-6 flex-1 w-full flex flex-col justify-center select-text">
        <GlassCard variant="strong" className="p-6 sm:p-8 backdrop-blur-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />

          {loading ? (
            <div className="flex flex-col justify-center items-center py-12 select-none">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-400/20 border-t-emerald-400 animate-spin mb-3" />
              <span className="text-xs text-slate-400 font-mono">กำลังโหลดคลิปที่แชร์...</span>
            </div>
          ) : errorMsg || !clip ? (
            <div className="text-center py-12 select-none">
              <ShieldAlert className="w-12 h-12 mx-auto text-rose-500 mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">ไม่พบข้อมูลคลิปบอร์ด</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                {errorMsg || "ข้อมูลคลิปบอร์ดนี้ไม่มีอยู่จริง หรืออาจถูกลบไปแล้ว หรือสิทธิ์การแชร์ถูกยกเลิก"}
              </p>
              <Link href="/" className="btn-secondary py-2 px-5 text-xs inline-flex items-center gap-1.5 mt-6">
                <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้าแรก
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Details */}
              <div className="flex justify-between items-start gap-4 flex-wrap select-none border-b border-white/5 pb-4">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2 inline-block">
                    Shared Clip
                  </span>
                  <h2 className="text-xl font-bold text-slate-200 truncate">{clip.title}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 mt-2 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      สร้างเมื่อ: {new Date(clip.createdAt).toLocaleDateString("th-TH")}
                    </span>
                    {clip.expiresAt && (
                      <span className="text-orange-400">
                        หมดอายุ: {new Date(clip.expiresAt).toLocaleDateString("th-TH")}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold border ${getLangClass(clip.language)}`}>
                  {clip.language}
                </span>
              </div>

              {/* Password Unlock */}
              {!decryptedContent ? (
                <div className="space-y-4 py-4 select-none">
                  <p className="text-xs text-amber-400 flex items-center gap-1.5">
                    <Lock className="w-4 h-4" /> คลิปบอร์ดนี้ถูกป้องกันไว้ด้วยรหัสผ่าน กรุณากรอกรหัสผ่านเพื่อเปิดดู
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="รหัสผ่านสำหรับถอดรหัส..."
                      className="flex-1 px-3 py-2 rounded-xl glass border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-xs"
                      onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }}
                    />
                    <button
                      onClick={handleUnlock}
                      className="btn-primary py-2 px-5 text-xs bg-gradient-to-r from-emerald-500 to-teal-500 cursor-pointer"
                    >
                      Unlock
                    </button>
                  </div>
                </div>
              ) : (
                /* Plaintext content rendering */
                <div className="space-y-4">
                  <pre className="w-full max-h-96 overflow-y-auto p-4 rounded-xl glass-dark border border-white/5 text-slate-200 text-xs font-mono leading-relaxed whitespace-pre-wrap select-text select-all">
                    {decryptedContent}
                  </pre>

                  {/* Actions list */}
                  <div className="flex gap-2.5 pt-2 select-none">
                    <button
                      onClick={handleCopy}
                      className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition"
                    >
                      <Copy className="w-3.5 h-3.5" /> คัดลอกข้อความ
                    </button>
                    <Link
                      href="/"
                      className="btn-secondary py-2.5 px-4 text-xs inline-flex items-center gap-1"
                    >
                      ← HOME
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </GlassCard>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-xs text-white/40 border-t border-white/5 bg-black/10 select-none">
        <p>© {new Date().getFullYear()} Online Clipboard | THE Facility</p>
      </footer>
    </div>
  );
}

"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Shield, Lock, LogOut, Key, Search, Plus, Sparkles,
  Eye, EyeOff, Copy, Trash2, Edit2, Share2, Calendar, FileText, Check, AlertTriangle
} from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import GlassCard from "@/components/ui/GlassCard";
import Navbar from "@/components/ui/Navbar";
import { useToast } from "@/components/ui/Toast";
import { encrypt, decrypt, encryptWithPassword, decryptWithPassword } from "@/lib/crypto";
import { saveSession, restoreSession, clearSession, SessionData } from "@/lib/auth";
import { validateClipboardId, createRateLimiter } from "@/lib/security";

// Types
interface Clip {
  id: string;
  title: string;
  content: string; // Plaintext representation on client
  encryptedContent: string; // Original ciphertext from DB
  language: string;
  isPublic: boolean;
  hasPassword: boolean;
  shareId: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  charCount: number;
}

export default function ClipboardPage() {
  const { showToast } = useToast();
  
  // Hydration state
  const [mounted, setMounted] = useState(false);

  // Authentication State
  const [session, setSession] = useState<SessionData | null>(null);
  const [clipboardInput, setClipboardInput] = useState("");
  const [showSessionInput, setShowSessionInput] = useState(false);
  const [sessionVisible, setSessionVisible] = useState(false);

  // Clips Dashboard States
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterLang, setFilterLang] = useState("");

  // Editor Modal States
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editorClipId, setEditorClipId] = useState<string | null>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorLang, setEditorLang] = useState("plain");
  const [editorExpire, setEditorExpire] = useState("");
  const [editorCustomExpire, setEditorCustomExpire] = useState("");
  const [editorPublic, setEditorPublic] = useState(false);
  const [editorProtect, setEditorProtect] = useState(false);
  const [editorPassword, setEditorPassword] = useState("");

  // View Modal States
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewClip, setViewClip] = useState<Clip | null>(null);
  const [viewPassword, setViewPassword] = useState("");
  const [viewDecryptedContent, setViewDecryptedContent] = useState<string | null>(null);

  // rate limiter connection attempts
  const connectionLimiter = useRef(createRateLimiter(5, 60000));
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  }, { dependencies: [session], scope: containerRef });

  // Initialize
  useEffect(() => {
    setMounted(true);
    const checkSession = async () => {
      const active = await restoreSession();
      if (active) {
        setSession(active);
        fetchClips(active);
      }
    };
    checkSession();
  }, []);

  // Fetch Clips from API
  const fetchClips = async (sessionData: SessionData) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clips?userId=${sessionData.hashedId}`);
      if (!res.ok) throw new Error("Failed to load clips");
      const data = await res.json();
      
      // Decrypt clips client-side
      const decryptedClips: Clip[] = [];
      for (const rawClip of data) {
        let plain = "[Encrypted — click to view]";
        if (!rawClip.hasPassword) {
          try {
            if (rawClip.isPublic) {
              plain = rawClip.content;
            } else {
              plain = await decrypt(rawClip.content, sessionData.rawId);
            }
          } catch {
            plain = "[Decryption error]";
          }
        }
        decryptedClips.push({
          ...rawClip,
          content: plain,
          encryptedContent: rawClip.content,
        });
      }
      setClips(decryptedClips);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Connect Session (Submit Clipboard ID)
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clipboardInput) return;

    if (!connectionLimiter.current.check()) {
      const wait = connectionLimiter.current.getRemainingTime();
      showToast(`พยายามเชื่อมต่อบ่อยเกินไป กรุณารออีก ${wait} วินาที`, "error");
      return;
    }

    try {
      const active = await saveSession(clipboardInput);
      setSession(active);
      setClipboardInput("");
      showToast("เชื่อมต่อเซสชันสำเร็จ!", "success");
      fetchClips(active);
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Generate Random Secure ID
  const handleGenerateId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const randomId = Array.from(bytes).map(b => chars[b % chars.length]).join("");
    setClipboardInput(randomId);
    setShowSessionInput(true);
    showToast("สร้างรหัสคลิปบอร์ดแบบสุ่มสำเร็จ", "info");
  };

  // Disconnect Session
  const handleDisconnect = () => {
    clearSession();
    setSession(null);
    setClips([]);
    showToast("ปิดการเชื่อมต่อเซสชันแล้ว", "info");
  };

  // Add / Edit Clip CRUD Submission
  const handleSaveClip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    if (!editorContent.trim()) {
      showToast("กรุณากรอกเนื้อหาคลิป", "error");
      return;
    }

    try {
      // Determine expiry date
      let expiresAt: string | null = null;
      if (editorExpire === "1h") {
        expiresAt = new Date(Date.now() + 3600000).toISOString();
      } else if (editorExpire === "24h") {
        expiresAt = new Date(Date.now() + 86400000).toISOString();
      } else if (editorExpire === "7d") {
        expiresAt = new Date(Date.now() + 86400000 * 7).toISOString();
      } else if (editorExpire === "30d") {
        expiresAt = new Date(Date.now() + 86400000 * 30).toISOString();
      } else if (editorExpire === "custom" && editorCustomExpire) {
        expiresAt = new Date(editorCustomExpire).toISOString();
      }

      // Encrypt content client-side
      let finalCiphertext = "";
      if (editorProtect && editorPassword) {
        finalCiphertext = await encryptWithPassword(editorContent, editorPassword);
      } else if (editorPublic) {
        finalCiphertext = editorContent;
      } else {
        finalCiphertext = await encrypt(editorContent, session.rawId);
      }

      const body = {
        userId: session.hashedId,
        title: editorTitle || "Untitled Clip",
        content: finalCiphertext,
        language: editorLang,
        isPublic: editorPublic,
        hasPassword: editorProtect && !!editorPassword,
        expiresAt,
      };

      let res;
      if (editorClipId) {
        // Edit Mode (PUT)
        res = await fetch(`/api/clips/${editorClipId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        // Create Mode (POST)
        res = await fetch("/api/clips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save clip");
      }

      showToast(editorClipId ? "แก้ไขคลิปสำเร็จ" : "บันทึกคลิปใหม่เรียบร้อย", "success");
      setEditorModalOpen(false);
      resetEditorState();
      fetchClips(session);
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Delete Clip
  const handleDeleteClip = async (clipId: string) => {
    if (!session) return;
    if (!confirm("คุณต้องการลบคำนี้ใช่หรือไม่?")) return;

    try {
      const res = await fetch(`/api/clips/${clipId}?userId=${session.hashedId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete clip");

      showToast("ลบข้อมูลสำเร็จ", "success");
      setViewModalOpen(false);
      fetchClips(session);
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Open Edit Modal with Pre-populated Data
  const openEditModal = (clip: Clip, decryptedContentText?: string | null) => {
    setEditorClipId(clip.id);
    setEditorTitle(clip.title);
    setEditorContent(decryptedContentText || clip.content);
    setEditorLang(clip.language);
    setEditorPublic(clip.isPublic);
    setEditorProtect(clip.hasPassword);
    setEditorPassword("");
    setEditorExpire(clip.expiresAt ? "custom" : "");
    setEditorCustomExpire(clip.expiresAt ? clip.expiresAt.substring(0, 16) : "");
    
    setEditorModalOpen(true);
    setViewModalOpen(false);
  };

  // Unlock Password protected clip
  const handleUnlockClip = async () => {
    if (!viewClip || !viewPassword) return;
    try {
      const plain = await decryptWithPassword(viewClip.encryptedContent, viewPassword);
      setViewDecryptedContent(plain);
      setViewPassword("");
      showToast("ถอดรหัสสำเร็จ", "success");
    } catch (err: any) {
      showToast("รหัสผ่านไม่ถูกต้อง", "error");
    }
  };

  // Share link copy
  const handleCopyShareLink = (clip: Clip) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}/tools/clipboard/share/${clip.shareId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => showToast("คัดลอกลิงก์แชร์สำเร็จ! นำไปส่งต่อได้ทันที"))
      .catch(() => showToast("ไม่สามารถคัดลอกลิงก์ได้", "error"));
  };

  const resetEditorState = () => {
    setEditorClipId(null);
    setEditorTitle("");
    setEditorContent("");
    setEditorLang("plain");
    setEditorExpire("");
    setEditorCustomExpire("");
    setEditorPublic(false);
    setEditorProtect(false);
    setEditorPassword("");
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

  // Search/Filter Clips logic
  const filteredClips = clips.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (!c.hasPassword && c.content.toLowerCase().includes(search.toLowerCase()));
    const matchesLang = !filterLang || c.language === filterLang;
    return matchesSearch && matchesLang;
  });

  if (!mounted) {
    return (
      <div className="min-h-screen text-slate-100 flex items-center justify-center">
        <GlassCard className="p-8 backdrop-blur-2xl flex flex-col items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin mb-3" />
          <span className="text-xs text-slate-400 font-semibold tracking-wider">กำลังโหลดข้อมูล...</span>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100 flex flex-col justify-between select-none">
      {/* Top Navbar */}
      <Navbar>
        {session ? (
          <div className="flex items-center gap-3">
            {/* Session Info Pills */}
            <div className="hidden sm:flex items-center gap-2 glass px-3.5 py-1.5 rounded-full border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-slate-300 max-w-[130px] truncate select-all">
                {sessionVisible ? session.rawId : "• • • • • • • •"}
              </span>
              <button 
                onClick={() => setSessionVisible(!sessionVisible)} 
                className="hover:text-white text-slate-400 transition"
              >
                {sessionVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(session.rawId);
                  showToast("คัดลอกเซสชัน ID แล้ว");
                }}
                className="hover:text-white text-slate-400 transition"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {/* Disconnect trigger */}
            <button
              onClick={handleDisconnect}
              className="px-3.5 py-1.5 rounded-full hover:bg-rose-500/25 border border-rose-500/35 bg-rose-500/10 text-rose-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
              title="Disconnect Session"
            >
              <LogOut className="w-3.5 h-3.5" /> ปิดการเชื่อมต่อ
            </button>
          </div>
        ) : (
          <Link
            href="/"
            className="glass px-4 py-2 rounded-full text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition flex items-center gap-1.5 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            หน้าแรก
          </Link>
        )}
      </Navbar>

      {/* Main Container */}
      <div ref={containerRef} className="max-w-6xl mx-auto pt-28 pb-16 px-6 flex-1 w-full flex flex-col justify-center">
        {!session ? (
          /* CONNECT SESSION LANDING VIEW */
          <div className="max-w-md mx-auto w-full">
            <GlassCard variant="strong" className="p-8 text-center backdrop-blur-2xl">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4 relative">
                <div className="absolute inset-0 bg-emerald-400/20 rounded-2xl blur-md animate-pulse-glow" />
                <Shield className="w-7 h-7 text-white relative z-10" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2 leading-tight">Sync Clipboard</h2>
              <p className="text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed">
                ป้อนรหัสผ่านหลักเพื่อซิงค์ข้อมูลคลิปบอร์ดแบบเข้ารหัสและป้องกันอุปกรณ์ปลายทางมองเห็นข้อมูลโดยไม่ได้รับอนุญาต
              </p>

              <form onSubmit={handleConnect} className="space-y-4 text-left">
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-400 mb-1.5 block">
                    Clipboard ID / Passphrase
                  </label>
                  <div className="relative">
                    <input
                      type={showSessionInput ? "text" : "password"}
                      value={clipboardInput}
                      onChange={(e) => setClipboardInput(e.target.value)}
                      placeholder="ป้อนรหัสเฉพาะตัวของคุณ..."
                      className="w-full px-4 py-2.5 rounded-xl glass-dark border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSessionInput(!showSessionInput)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showSessionInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full btn-primary bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm flex justify-center items-center gap-2"
                >
                  <Key className="w-4 h-4" /> Connect Session
                </button>

                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-slate-600 text-xs select-none">หรือ</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateId}
                  className="w-full btn-secondary py-2.5 text-xs flex justify-center items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Generate Secure Random ID
                </button>
              </form>

              {/* Warning */}
              <div className="mt-6 text-left p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400/80 leading-relaxed flex gap-2.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
                <div>
                  <strong>ประกาศความปลอดภัย:</strong> ทุกอุปกรณ์ที่ซิงค์ผ่าน ID เดียวกันสามารถเข้าถึงข้อมูลของคุณได้ หากทำ ID นี้สูญหาย ข้อมูลเก่าทั้งหมดจะไม่สามารถกู้คืนได้เนื่องจากการถอดรหัสทำได้เฉพาะฝั่ง Client เท่านั้น
                </div>
              </div>
            </GlassCard>
          </div>
        ) : (
          /* DASHBOARD VIEW */
          <div className="space-y-6 w-full">
            {/* Hero */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                Online Clipboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                คลิปข้อมูลของคุณถูกเข้ารหัส <strong className="text-emerald-400 font-bold">End-to-End</strong> (AES-256-GCM) ทั้งหมด แม้แต่ฝั่งโฮสต์ของเซิร์ฟเวอร์ก็ไม่สามารถอ่านข้อมูลของคุณได้
              </p>
            </div>

            {/* Actions Bar */}
            <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-3 border border-white/5">
              <button
                onClick={() => {
                  resetEditorState();
                  setEditorModalOpen(true);
                }}
                className="btn-primary py-2 px-5 text-xs bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> New Clip
              </button>

              <div className="flex-1 relative min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหาข้อความ..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg glass-dark border border-white/5 text-white placeholder-slate-600 focus:outline-none text-xs sm:text-sm"
                />
              </div>

              <select
                value={filterLang}
                onChange={(e) => setFilterLang(e.target.value)}
                className="px-3 py-2 rounded-lg glass-dark border border-white/5 text-white focus:outline-none text-xs sm:text-sm"
              >
                <option value="">ทุกภาษา</option>
                <option value="plain">Plain text</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
                <option value="sql">SQL</option>
              </select>
            </div>

            {/* Clips Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-400/20 border-t-emerald-400 animate-spin" />
              </div>
            ) : filteredClips.length === 0 ? (
              <div className="text-center py-16 glass rounded-2xl border border-white/5">
                <FileText className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <p className="text-sm text-slate-400">ไม่พบคลิปข้อมูลใดๆ</p>
                <p className="text-xs text-slate-500 mt-1">คลิกที่ปุ่ม New Clip เพื่อเพิ่มข้อมูลในระบบ</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 select-text">
                {filteredClips.map((clip) => (
                  <div
                    key={clip.id}
                    onClick={() => {
                      setViewClip(clip);
                      setViewDecryptedContent(clip.hasPassword ? null : clip.content);
                      setViewModalOpen(true);
                    }}
                    className="p-5 rounded-xl glass hover:border-emerald-500/30 cursor-pointer border border-white/5 flex flex-col justify-between h-44 relative group select-text transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold border ${getLangClass(clip.language)}`}>
                          {clip.language}
                        </span>
                        {clip.hasPassword ? (
                          <span className="text-[9px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-semibold flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Password Locked
                          </span>
                        ) : clip.isPublic ? (
                          <span className="text-[9px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 font-semibold flex items-center gap-1">
                            <Share2 className="w-2.5 h-2.5" /> Public Shareable
                          </span>
                        ) : (
                          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                            🔒 Private Encrypted
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-200 line-clamp-1 truncate select-none">
                        {clip.title}
                      </h4>
                      <pre className="text-[10px] text-slate-400 font-mono mt-2 line-clamp-3 overflow-hidden bg-black/10 p-2 rounded max-h-16 leading-relaxed select-text select-all">
                        {clip.hasPassword ? "[Password Protected]" : clip.content}
                      </pre>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-mono select-none">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(clip.updatedAt).toLocaleDateString("th-TH")}
                      </span>
                      {clip.expiresAt && (
                        <span className="text-orange-400 font-semibold">
                          หมดอายุเร็วๆ นี้
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==========================================
          MODAL: ADD & EDIT CLIP
         ========================================== */}
      <div className={`fixed inset-0 z-[999] flex items-center justify-center p-4 transition-all duration-300 ${
        editorModalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}>
        <div
          onClick={() => setEditorModalOpen(false)}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />
        <div className={`relative w-full max-w-lg glass-strong p-6 sm:p-8 rounded-2xl z-10 max-h-[90vh] overflow-y-auto transition-all duration-300 transform ${
          editorModalOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}>
              <h3 className="text-lg font-bold text-white mb-6">
                {editorClipId ? "แก้ไขข้อมูลคลิปบอร์ด" : "เพิ่มคลิปบอร์ดใหม่ (Encrypted)"}
              </h3>

              <form onSubmit={handleSaveClip} className="space-y-4">
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-400 mb-1.5 block">หัวข้อ (Title)</label>
                  <input
                    type="text"
                    value={editorTitle}
                    onChange={(e) => setEditorTitle(e.target.value)}
                    placeholder="ป้อนชื่อหัวข้อคลิปบอร์ด..."
                    className="w-full px-4 py-2 rounded-xl glass-dark border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-sm"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] sm:text-xs font-bold text-slate-400">เนื้อหาข้อมูล (Content)</label>
                    <span className="text-[9px] text-slate-500 font-mono">{editorContent.length} ตัวอักษร</span>
                  </div>
                  <textarea
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    placeholder="ป้อนข้อมูลที่ต้องการบันทึก..."
                    className="w-full h-36 p-3 rounded-xl glass-dark border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-sm font-mono leading-relaxed"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] sm:text-xs font-bold text-slate-400 mb-1.5 block">ประเภทข้อมูล</label>
                    <select
                      value={editorLang}
                      onChange={(e) => setEditorLang(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl glass-dark border border-white/5 text-white focus:outline-none text-xs"
                    >
                      <option value="plain">Plain text</option>
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="html">HTML</option>
                      <option value="css">CSS</option>
                      <option value="json">JSON</option>
                      <option value="sql">SQL</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] sm:text-xs font-bold text-slate-400 mb-1.5 block">หมดอายุอัตโนมัติ</label>
                    <select
                      value={editorExpire}
                      onChange={(e) => setEditorExpire(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl glass-dark border border-white/5 text-white focus:outline-none text-xs"
                    >
                      <option value="">ถาวร</option>
                      <option value="1h">1 ชั่วโมง</option>
                      <option value="24h">24 ชั่วโมง</option>
                      <option value="7d">7 วัน</option>
                      <option value="30d">30 วัน</option>
                      <option value="custom">กำหนดเอง...</option>
                    </select>
                  </div>
                </div>

                {editorExpire === "custom" && (
                  <div className="p-3.5 rounded-xl glass-dark border border-white/5 mt-2">
                    <label className="text-[10px] font-bold text-slate-400 mb-1.5 block">เลือกเวลาหมดอายุ</label>
                    <input
                      type="datetime-local"
                      value={editorCustomExpire}
                      onChange={(e) => setEditorCustomExpire(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl glass border border-white/5 text-white focus:outline-none text-xs"
                    />
                  </div>
                )}

                {/* Security Setup Options */}
                <div className="p-4 rounded-xl glass-dark border border-white/5 space-y-3">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Security Options
                  </span>

                  {/* Public toggler */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-slate-300">เปิดแชร์สาธารณะ</div>
                      <div className="text-[9px] text-slate-500">ทุกคนที่มีลิงก์จะสามารถเปิดอ่านได้</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={editorPublic}
                      onChange={(e) => {
                        setEditorPublic(e.target.checked);
                      }}
                      className="w-4 h-4 rounded text-emerald-400 focus:ring-0 cursor-pointer"
                    />
                  </label>

                  {/* Password toggler */}
                  <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-white/5">
                    <div>
                      <div className="text-xs font-bold text-slate-300">ป้องกันด้วยรหัสผ่านอีกชั้น</div>
                      <div className="text-[9px] text-slate-500">จำเป็นต้องกรอกรหัสผ่านเพื่อถอดรหัสข้อความ</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={editorProtect}
                      onChange={(e) => setEditorProtect(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-400 focus:ring-0 cursor-pointer"
                    />
                  </label>

                  {editorProtect && (
                    <div className="pt-2">
                      <input
                        type="password"
                        value={editorPassword}
                        onChange={(e) => setEditorPassword(e.target.value)}
                        placeholder="ตั้งรหัสผ่านสำหรับคลิปนี้..."
                        className="w-full px-3 py-2 rounded-xl glass border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-xs"
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditorModalOpen(false)}
                    className="flex-1 btn-secondary py-2.5 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary py-2.5 text-xs"
                  >
                    Save (Encrypted)
                  </button>
                </div>
              </form>
            </div>
          </div>

      {/* ==========================================
          MODAL: VIEW CLIP DETAILS
         ========================================== */}
      <div className={`fixed inset-0 z-[999] flex items-center justify-center p-4 transition-all duration-300 ${
        viewModalOpen && viewClip ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}>
        <div
          onClick={() => setViewModalOpen(false)}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />
        <div className={`relative w-full max-w-lg glass-strong p-6 sm:p-8 rounded-2xl z-10 max-h-[90vh] overflow-y-auto transition-all duration-300 transform ${
          viewModalOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}>
          {viewClip && (
            <>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate">{viewClip.title}</h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1 select-none">
                    <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold border ${getLangClass(viewClip.language)}`}>
                      {viewClip.language}
                    </span>
                    <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                      🔒 AES-256
                    </span>
                  </div>
                </div>
              </div>

              {/* Password request forms */}
              {!viewDecryptedContent ? (
                <div className="py-6 space-y-4">
                  <p className="text-xs text-amber-400 flex items-center gap-1.5">
                    <Lock className="w-4 h-4" /> กรุณากรอกรหัสผ่านเพื่อถอดรหัสเนื้อหาคลิปบอร์ดนี้
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={viewPassword}
                      onChange={(e) => setViewPassword(e.target.value)}
                      placeholder="รหัสผ่าน..."
                      className="flex-1 px-3 py-2 rounded-xl glass border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-xs"
                      onKeyDown={(e) => { if (e.key === "Enter") handleUnlockClip(); }}
                    />
                    <button
                      onClick={handleUnlockClip}
                      className="btn-primary py-2 px-4 text-xs bg-gradient-to-r from-emerald-500 to-teal-500"
                    >
                      Unlock
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 select-text">
                  <pre className="w-full max-h-72 overflow-y-auto p-4 rounded-xl glass-dark border border-white/5 text-slate-200 text-xs font-mono leading-relaxed whitespace-pre-wrap select-text select-all">
                    {viewDecryptedContent}
                  </pre>

                  {/* Actions buttons inside preview */}
                  <div className="flex flex-wrap gap-2 pt-2 select-none">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(viewDecryptedContent || "");
                        showToast("คัดลอกเนื้อหาคลิปบอร์ดสำเร็จ!");
                      }}
                      className="px-4 py-2 text-xs font-bold rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 cursor-pointer transition"
                    >
                      <Copy className="w-3.5 h-3.5" /> คัดลอกข้อความ
                    </button>
                    {viewClip.isPublic && (
                      <button
                        onClick={() => handleCopyShareLink(viewClip)}
                        className="px-4 py-2 text-xs font-bold rounded-full bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/20 flex items-center gap-1 cursor-pointer transition"
                      >
                        <Share2 className="w-3.5 h-3.5" /> แชร์ลิงก์
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(viewClip, viewDecryptedContent)}
                      className="px-4 py-2 text-xs font-bold rounded-full bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 border border-indigo-500/20 flex items-center gap-1 cursor-pointer transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> แก้ไขข้อมูล
                    </button>
                    <button
                      onClick={() => handleDeleteClip(viewClip.id)}
                      className="px-4 py-2 text-xs font-bold rounded-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 flex items-center gap-1 cursor-pointer transition ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> ลบคำนี้
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
          </div>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-xs text-white/40 border-t border-white/5 bg-black/10 select-none">
        <p>© {new Date().getFullYear()} Online Clipboard | THE Facility</p>
      </footer>
    </div>
  );
}

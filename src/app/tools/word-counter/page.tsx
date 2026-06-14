"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Copy, Share2, Printer, Save, ArrowLeft } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Navbar from "@/components/ui/Navbar";
import { useToast } from "@/components/ui/Toast";
import { calculateAllStats, WordStats } from "@/lib/word-count";
import { escapeHtml } from "@/lib/security";

export default function WordCounterPage() {
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [stats, setStats] = useState<WordStats>({
    chars: 0,
    noSpaces: 0,
    words: 0,
    lines: 0,
    sentences: 0,
    paragraphs: 0,
    unique: 0,
    avgLen: 0,
    minutesToRead: 0,
    secondsToRead: 0,
  });

  // Load initial content from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("wordcounter-text") || "";
    setText(saved);
    setStats(calculateAllStats(saved));
  }, []);

  // Handle text change with automatic save
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    const newStats = calculateAllStats(newText);
    setStats(newStats);
    
    // Auto-save
    localStorage.setItem("wordcounter-text", newText);
  };

  const handleClear = () => {
    setText("");
    setStats(calculateAllStats(""));
    localStorage.setItem("wordcounter-text", "");
    showToast("ล้างข้อความเรียบร้อยแล้ว", "info");
  };

  const handleCopy = () => {
    if (!text) {
      showToast("ไม่มีข้อความให้คัดลอก", "error");
      return;
    }
    navigator.clipboard.writeText(text)
      .then(() => showToast("คัดลอกข้อความสำเร็จ!"))
      .catch(() => showToast("ไม่สามารถคัดลอกข้อความได้", "error"));
  };

  const handleManualSave = () => {
    localStorage.setItem("wordcounter-text", text);
    showToast("บันทึกข้อมูลเรียบร้อยแล้ว", "success");
  };

  const handlePrint = () => {
    if (!text) {
      showToast("ไม่มีข้อความให้พิมพ์", "error");
      return;
    }
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <title>Word Counter - Print</title>
        <style>
          body { font-family: 'Sarabun', sans-serif; padding: 25px; line-height: 1.6; color: #333; }
          pre { white-space: pre-wrap; word-wrap: break-word; border: 1px solid #ddd; padding: 15px; background: #f9f9f9; border-radius: 5px; font-size: 14px; }
          h2 { border-bottom: 2px solid #5b21b6; padding-bottom: 8px; color: #5b21b6; }
        </style>
      </head>
      <body>
        <h2>ข้อความสำหรับพิมพ์:</h2>
        <pre>${escapeHtml(text)}</pre>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const handleShare = () => {
    if (!text) {
      showToast("ไม่มีข้อความให้แชร์", "error");
      return;
    }
    if (navigator.share) {
      navigator.share({ title: "Word Counter Text", text })
        .then(() => showToast("แชร์สำเร็จ", "info"))
        .catch((err) => {
          if (err.name !== "AbortError") {
            showToast("การแชร์ล้มเหลว", "error");
          }
        });
    } else {
      showToast("อุปกรณ์นี้ไม่รองรับการแชร์แบบ Web Share API", "info");
    }
  };

  const statsCards = [
    { label: "ตัวอักษรทั้งหมด", value: stats.chars, borderColor: "border-blue-500 text-blue-400" },
    { label: "ไม่รวมช่องว่าง", value: stats.noSpaces, borderColor: "border-cyan-500 text-cyan-400" },
    { label: "คำ", value: stats.words, borderColor: "border-emerald-500 text-emerald-400" },
    { label: "บรรทัด", value: stats.lines, borderColor: "border-yellow-500 text-yellow-400" },
    { label: "ประโยค", value: stats.sentences, borderColor: "border-purple-500 text-purple-400" },
    { label: "ย่อหน้า", value: stats.paragraphs, borderColor: "border-slate-500 text-slate-400" },
    { label: "คำไม่ซ้ำ", value: stats.unique, borderColor: "border-rose-500 text-rose-400" },
    { label: "ยาวเฉลี่ย/คำ", value: stats.avgLen.toFixed(2), borderColor: "border-indigo-500 text-indigo-400" },
    { label: "เวลาอ่าน (นาที)", value: stats.minutesToRead.toFixed(2), borderColor: "border-orange-500 text-orange-400" },
    { label: "เวลาอ่าน (วิ)", value: stats.secondsToRead, borderColor: "border-amber-500 text-amber-400" },
  ];

  return (
    <div className="min-h-screen text-slate-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <Navbar>
        <Link
          href="/"
          className="glass px-4 py-2 rounded-full text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition flex items-center gap-1.5 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          หน้าแรก
        </Link>
      </Navbar>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto pt-28 pb-16 px-6 flex-1 w-full flex flex-col justify-center">
        <GlassCard className="p-6 sm:p-8 backdrop-blur-2xl relative overflow-hidden">
          {/* Accent top border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />

          {/* Heading */}
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              Word Counter
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              นับจำนวนคำ ตัวอักษร บรรทัด และประโยค พร้อมประเมินเวลาอ่านโดยอัตโนมัติ
            </p>
          </div>

          {/* Text Area */}
          <div className="mb-6 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl blur opacity-0 group-focus-within:opacity-20 transition duration-300" />
            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder="พิมพ์หรือวางข้อความของคุณที่นี่..."
              className="relative w-full h-60 sm:h-72 p-4 rounded-xl glass-dark border border-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm sm:text-base leading-relaxed resize-none"
            />
          </div>

          {/* Actions Toolbar */}
          <div className="flex flex-wrap gap-2.5 mb-8 justify-center sm:justify-start">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-xs font-semibold rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-xs font-semibold rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            <button
              onClick={handleManualSave}
              className="px-4 py-2 text-xs font-semibold rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-semibold rounded-full bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 border border-slate-500/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 text-xs font-semibold rounded-full bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {statsCards.map((card, idx) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.4 }}
                className={`p-3.5 rounded-xl glass border-l-4 ${card.borderColor.split(" ")[0]} flex flex-col justify-between transition hover:-translate-y-0.5 hover:shadow-lg shadow-sm`}
              >
                <span className="text-[10px] sm:text-xs font-medium opacity-60 uppercase tracking-wider mb-1 leading-snug">
                  {card.label}
                </span>
                <motion.span
                  key={card.value}
                  initial={{ scale: 1.15, filter: "brightness(1.5)" }}
                  animate={{ scale: 1, filter: "brightness(1)" }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={`text-xl font-bold truncate ${card.borderColor.split(" ").slice(1).join(" ")}`}
                >
                  {card.value.toLocaleString()}
                </motion.span>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-xs text-white/40 border-t border-white/5 bg-black/10">
        <p>© {new Date().getFullYear()} Word Counter | THE Facility</p>
      </footer>
    </div>
  );
}

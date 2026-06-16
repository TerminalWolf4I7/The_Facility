"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Play, Pause, RotateCcw, BookOpen, ArrowLeft, History, Info, Sparkles } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Navbar from "@/components/ui/Navbar";
import { useToast } from "@/components/ui/Toast";
import { segmentText } from "@/lib/speed-read";

export default function SpeedReaderPage() {
  const { showToast } = useToast();
  
  // State variables
  const [text, setText] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(300); // WPM
  const [elapsedTime, setElapsedTime] = useState(0); // ms
  const [history, setHistory] = useState<number[]>([]);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved content and history
  useEffect(() => {
    const savedText = localStorage.getItem("speedread-text") || "";
    setText(savedText);
    setWords(segmentText(savedText));

    const savedHistory = localStorage.getItem("wpm-history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Text changes handler with auto-save
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    const newWords = segmentText(val);
    setWords(newWords);
    setCurrentWordIndex(0);
    setElapsedTime(0);
    setIsPlaying(false);

    localStorage.setItem("speedread-text", val);
  };

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying || currentWordIndex >= words.length) return;

    const delay = 60000 / speed;
    const interval = setTimeout(() => {
      setCurrentWordIndex((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(interval);
  }, [isPlaying, currentWordIndex, words, speed]);

  // Elapsed timer loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Handle completion
  useEffect(() => {
    if (words.length > 0 && currentWordIndex === words.length && isPlaying) {
      setIsPlaying(false);
      const minutes = elapsedTime > 0 ? elapsedTime / 60000 : 1;
      const wpm = Math.round(words.length / minutes);

      const updatedHistory = [wpm, ...history].slice(0, 5);
      setHistory(updatedHistory);
      localStorage.setItem("wpm-history", JSON.stringify(updatedHistory));
      showToast("เสร็จสิ้นการอ่าน!", "success");
    }
  }, [currentWordIndex, words, isPlaying, elapsedTime, history]);

  const handleStart = () => {
    if (words.length === 0) {
      showToast("กรุณาป้อนข้อความก่อนเริ่มอ่าน", "error");
      return;
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentWordIndex(0);
    setElapsedTime(0);
  };

  const handleClearHistory = () => {
    localStorage.removeItem("wpm-history");
    setHistory([]);
    showToast("ล้างประวัติการอ่านแล้ว", "info");
  };

  // Format Elapsed Time (MM:SS)
  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentWord =
    currentWordIndex === 0 && !isPlaying
      ? "คำจะแสดงที่นี่"
      : currentWordIndex >= words.length
      ? "เสร็จสิ้น"
      : words[currentWordIndex];

  const progressPercent = words.length > 0 ? (currentWordIndex / words.length) * 100 : 0;

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
      <main className="max-w-3xl mx-auto pt-28 pb-16 px-6 flex-1 w-full flex flex-col gap-6 justify-center">
        {/* Editor Card */}
        <GlassCard className="p-6 backdrop-blur-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500" />
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 text-center mb-1">
            Speed Reader
          </h1>
          <p className="text-xs text-slate-400 text-center mb-6">
            ฝึกทักษะการอ่านเร็วผ่านการแสดงผลคำทีละคำด้วยเทคโนโลยีแบ่งคำภาษาไทย
          </p>

          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="พิมพ์หรือวางข้อความของคุณที่นี่..."
            className="w-full h-32 p-3 rounded-lg glass-dark border border-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm leading-relaxed resize-none mb-4"
          />

          {/* Speed & Controls */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span>ความเร็วการอ่าน (คำต่อนาที - WPM)</span>
                <span className="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">{speed} WPM</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="10"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start pt-2">
              <button
                onClick={handleStart}
                disabled={isPlaying || words.length === 0}
                className="px-5 py-2 text-xs font-bold rounded-full bg-blue-500/20 hover:bg-blue-500/35 text-blue-300 border border-blue-500/25 flex items-center gap-1.5 transition disabled:opacity-30 active:scale-95 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" /> เริ่มอ่าน
              </button>
              <button
                onClick={handlePause}
                disabled={!isPlaying}
                className="px-5 py-2 text-xs font-bold rounded-full bg-yellow-500/20 hover:bg-yellow-500/35 text-yellow-300 border border-yellow-500/25 flex items-center gap-1.5 transition disabled:opacity-30 active:scale-95 cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" /> หยุดชั่วคราว
              </button>
              <button
                onClick={handleReset}
                className="px-5 py-2 text-xs font-bold rounded-full bg-slate-500/20 hover:bg-slate-500/35 text-slate-300 border border-slate-500/25 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> เริ่มใหม่
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Reader Display Card */}
        <GlassCard className="p-6 backdrop-blur-2xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold opacity-70">หน้าจอแสดงผลการอ่าน</h2>
            {isPlaying && (
              <div className="px-3 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/25 text-xs text-orange-400 font-mono">
                {formatTime(elapsedTime)}
              </div>
            )}
          </div>

          <div className="h-32 flex items-center justify-center text-center">
            <div
              key={`${currentWord}-${currentWordIndex}`}
              className="text-3xl sm:text-4xl font-bold tracking-wide text-white leading-normal"
            >
              {currentWord}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-blue-500 transition-all duration-100 ease-out"
            />
          </div>
          <div className="flex justify-between text-xs text-white/50 mt-1.5 font-mono">
            <span>คำที่ {currentWordIndex}</span>
            <span>ทั้งหมด {words.length} คำ</span>
          </div>
        </GlassCard>

        {/* Tips & History Grid */}
        <div className="grid sm:grid-cols-2 gap-6">
          <GlassCard className="p-5 backdrop-blur-xl">
            <h3 className="text-sm font-bold flex items-center gap-1.5 text-cyan-400 mb-3">
              <Info className="w-4 h-4" /> เคล็ดลับการอ่านเร็ว
            </h3>
            <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4 leading-relaxed">
              <li>ฝึกอ่านอย่างต่อเนื่อง 10-15 นาทีเป็นประจำทุกวัน</li>
              <li>ปรับความเร็วที่สามารถทำความเข้าใจได้แล้วค่อยๆ ท้าทายตัวเอง</li>
              <li>หลีกเลี่ยงการออกเสียงในใจ (Subvocalization) เพื่อให้อ่านได้เร็วขึ้น</li>
              <li>เน้นการสแกนจับสายตาไปยังคำที่ปรากฏตรงกลางหน้าจอ</li>
            </ul>
          </GlassCard>

          <GlassCard className="p-5 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold flex items-center gap-1.5 text-orange-400">
                  <History className="w-4 h-4" /> ประวัติความเร็ว (สูงสุด 5 ครั้ง)
                </h3>
                {history.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition"
                  >
                    ล้างประวัติ
                  </button>
                )}
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
                {history.length === 0 ? (
                  <li className="text-slate-500 italic">ยังไม่มีประวัติการอ่าน</li>
                ) : (
                  history.map((wpm, idx) => (
                    <li key={idx} className="flex justify-between py-0.5 border-b border-white/5">
                      <span>ครั้งที่ {idx + 1}</span>
                      <span className="font-bold text-orange-400">{wpm} คำ/นาที</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </GlassCard>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-xs text-white/40 border-t border-white/5 bg-black/10">
        <p>© {new Date().getFullYear()} Speed Reader | THE Facility</p>
      </footer>
    </div>
  );
}

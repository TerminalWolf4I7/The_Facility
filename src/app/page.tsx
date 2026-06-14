"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, Zap, Edit, Clipboard } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Navbar from "@/components/ui/Navbar";

// Live Clock Component (Client-only to avoid SSR mismatch)
function Clock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString("th-TH", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return <div className="w-16"></div>;
  return <div className="text-white text-base font-mono">{time}</div>;
}

export default function LandingPage() {
  const tools = [
    {
      href: "/tools/word-counter",
      emoji: "📝",
      icon: FileText,
      title: "Word Counter",
      description: "นับจำนวนคำ ตัวอักษร และวิเคราะห์สถิติของข้อความอย่างละเอียด",
      color: "from-rose-500/20 to-rose-600/60",
      accent: "text-rose-400",
    },
    {
      href: "/tools/speed-reader",
      emoji: "🚀",
      icon: Zap,
      title: "Speed Reader",
      description: "ฝึกอ่านเร็วด้วยการแสดงผลคำทีละคำอย่างต่อเนื่อง ปรับความเร็วได้อิสระ",
      color: "from-cyan-500/20 to-blue-600/60",
      accent: "text-cyan-400",
    },
    {
      href: "/tools/markdown",
      emoji: "📊",
      icon: Edit,
      title: "Markdown Converter",
      description: "แปลง Markdown เป็น Rich Text และสร้างตารางสำหรับวางใน Google Docs",
      color: "from-purple-500/20 to-pink-600/60",
      accent: "text-purple-400",
    },
    {
      href: "/tools/clipboard",
      emoji: "📋",
      icon: Clipboard,
      title: "Online Clipboard",
      description: "บันทึก ซิงค์ และแชร์คลิปบอร์ดออนไลน์ด้วยการเข้ารหัส AES-256-GCM ปลอดภัยสูงสุด",
      color: "from-emerald-500/20 to-teal-600/60",
      accent: "text-emerald-400",
      secure: true,
    },
  ];

  return (
    <div className="min-h-screen text-slate-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <Navbar>
        <Clock />
      </Navbar>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto pt-32 pb-16 px-6 flex-1 flex flex-col justify-center w-full">
        <GlassCard className="p-8 sm:p-12 relative overflow-hidden backdrop-blur-2xl">
          {/* Accent top border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-emerald-500" />

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
                Text Analysis & Utilities
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
              ชุดเครื่องมือจัดการข้อความและซิงค์ข้อมูลประสิทธิภาพสูง พร้อมการเข้ารหัสความปลอดภัยในระดับสูงสุด
            </p>
          </motion.div>

          {/* Tool Cards Grid */}
          <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
            {tools.map((tool, index) => (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="relative overflow-hidden rounded-xl border border-white/5 cursor-pointer group"
              >
                <Link href={tool.href} className="block p-6 h-full relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-3xl filter drop-shadow-md select-none">{tool.emoji}</span>
                    <tool.icon className={`w-6 h-6 ${tool.accent} opacity-80 group-hover:scale-110 transition-transform duration-300`} />
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-white transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-3">
                    {tool.description}
                  </p>
                  {tool.secure && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-semibold text-emerald-400 tracking-wider">
                      🔒 AES-256 SECURE
                    </div>
                  )}
                </Link>

                {/* Hover slide bg effect */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${tool.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10`}
                />
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-xs text-white/40 border-t border-white/5 bg-black/10">
        <p>© {new Date().getFullYear()} THE Facility. All rights reserved.</p>
      </footer>
    </div>
  );
}

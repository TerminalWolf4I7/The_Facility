"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { FileText, Zap, Edit, Clipboard } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Navbar from "@/components/ui/Navbar";
import { gsap, useGSAP } from "@/lib/gsap";

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
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Entry Animation
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      
      tl.fromTo(".hero-content", 
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8 }
      );
      
      tl.fromTo(".tool-card", 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 },
        "-=0.4"
      );

      // Premium 3D Hover Spotlight Effect
      const cards = gsap.utils.toArray<HTMLElement>(".tool-card");
      cards.forEach((card) => {
        const glow = card.querySelector<HTMLElement>(".hover-glow");
        
        const onMouseMove = (e: MouseEvent) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          // Subtle 3D tilt calculation (max 10 degrees)
          const rotateY = ((x / rect.width) - 0.5) * 12; 
          const rotateX = -((y / rect.height) - 0.5) * 12; 
          
          gsap.to(card, {
            rotateY: rotateY,
            rotateX: rotateX,
            transformPerspective: 800,
            ease: "power2.out",
            duration: 0.3,
            overwrite: "auto"
          });
          
          if (glow) {
            gsap.to(glow, {
              left: x,
              top: y,
              opacity: 1,
              duration: 0.2,
              overwrite: "auto"
            });
          }
        };
        
        const onMouseLeave = () => {
          gsap.to(card, {
            rotateY: 0,
            rotateX: 0,
            scale: 1,
            ease: "power2.out",
            duration: 0.5,
            overwrite: "auto"
          });
          
          if (glow) {
            gsap.to(glow, {
              opacity: 0,
              duration: 0.5,
              overwrite: "auto"
            });
          }
        };

        const onMouseEnter = () => {
          gsap.to(card, {
            scale: 1.02,
            ease: "power2.out",
            duration: 0.3,
            overwrite: "auto"
          });
        };

        card.addEventListener("mousemove", onMouseMove);
        card.addEventListener("mouseleave", onMouseLeave);
        card.addEventListener("mouseenter", onMouseEnter);
      });
    },
    { scope: container }
  );

  const tools = [
    {
      href: "/tools/word-counter",
      emoji: "📝",
      icon: FileText,
      title: "Word Counter",
      description: "นับจำนวนคำ ตัวอักษร และวิเคราะห์สถิติของข้อความอย่างละเอียด",
      color: "from-rose-500/10 to-rose-600/40",
      accent: "text-rose-400",
    },
    {
      href: "/tools/speed-reader",
      emoji: "🚀",
      icon: Zap,
      title: "Speed Reader",
      description: "ฝึกอ่านเร็วด้วยการแสดงผลคำทีละคำอย่างต่อเนื่อง ปรับความเร็วได้อิสระ",
      color: "from-cyan-500/10 to-blue-600/40",
      accent: "text-cyan-400",
    },
    {
      href: "/tools/markdown",
      emoji: "📊",
      icon: Edit,
      title: "Markdown Converter",
      description: "แปลง Markdown เป็น Rich Text และสร้างตารางสำหรับวางใน Google Docs",
      color: "from-purple-500/10 to-pink-600/40",
      accent: "text-purple-400",
    },
    {
      href: "/tools/clipboard",
      emoji: "📋",
      icon: Clipboard,
      title: "Online Clipboard",
      description: "บันทึก ซิงค์ และแชร์คลิปบอร์ดออนไลน์ด้วยการเข้ารหัส AES-256-GCM ปลอดภัยสูงสุด",
      color: "from-emerald-500/10 to-teal-600/40",
      accent: "text-emerald-400",
      secure: true,
    },
  ];

  return (
    <div ref={container} className="min-h-screen text-slate-100 flex flex-col justify-between">
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
          <div className="hero-content text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
                Text Analysis & Utilities
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
              ชุดเครื่องมือจัดการข้อความและซิงค์ข้อมูลประสิทธิภาพสูง พร้อมการเข้ารหัสความปลอดภัยในระดับสูงสุด
            </p>
          </div>

          {/* Tool Cards Grid */}
          <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
            {tools.map((tool) => (
              <div
                key={tool.title}
                className="tool-card relative overflow-hidden rounded-xl border border-white/5 cursor-pointer group select-none bg-white/5"
                style={{ transformStyle: "preserve-3d", willChange: "transform" }}
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

                {/* Hover spotlight gradient glow */}
                <div className="hover-glow absolute w-56 h-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 pointer-events-none opacity-0 blur-2xl z-0" />

                {/* Hover slide bg effect */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${tool.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10`}
                />
              </div>
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

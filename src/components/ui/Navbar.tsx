"use client";
import React, { useRef } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { gsap, useGSAP } from "@/lib/gsap";

interface NavbarProps {
  children?: React.ReactNode;
}

export default function Navbar({ children }: NavbarProps) {
  const navRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);

  useGSAP(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down: slide up out of view
        gsap.to(navRef.current, { yPercent: -100, duration: 0.3, ease: "power2.out" });
      } else {
        // Scrolling up: slide down into view
        gsap.to(navRef.current, { yPercent: 0, duration: 0.3, ease: "power2.out" });
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  });

  return (
    <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-black/30 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-3 select-none group">
          <div className="logo-pulse w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
            F
          </div>
          <div>
            <div className="text-sm font-bold text-grad leading-tight">THE Facility</div>
            <div className="text-[10px] text-white/40 leading-tight">Online Utility Kit</div>
          </div>
        </Link>

        {/* Dynamic Center/Right Page Specific Actions */}
        <div className="flex items-center gap-4">
          {children}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

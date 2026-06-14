"use client";
import React from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { motion } from "framer-motion";

interface NavbarProps {
  children?: React.ReactNode;
}

export default function Navbar({ children }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-black/30 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-3 select-none group">
          <motion.div
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(52,211,153,0.4)",
                "0 0 0 8px rgba(52,211,153,0)",
                "0 0 0 0 rgba(52,211,153,0.4)",
              ],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm"
          >
            F
          </motion.div>
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

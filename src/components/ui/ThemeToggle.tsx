"use client";
import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    // Default to dark mode if not set to match "THE Facility" visual design
    const isDark = savedTheme !== "light";
    const initialTheme = isDark ? "dark" : "light";
    setTheme(initialTheme);
    
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 dark:bg-dark-300 dark:hover:bg-dark-400 border border-white/15 text-white shadow-md cursor-pointer transition-colors duration-200"
      aria-label="สลับโหมดมืด/สว่าง"
    >
      {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-purple-400" />}
    </motion.button>
  );
}

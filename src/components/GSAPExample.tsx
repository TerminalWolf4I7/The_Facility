"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

export default function GSAPExample() {
  const container = useRef<HTMLDivElement>(null);

  // useGSAP is a drop-in replacement for useEffect/useLayoutEffect
  // It automatically handles cleanup on unmount and prevents duplicate animations in Strict Mode
  useGSAP(
    () => {
      // Animate elements with class .box scoped inside our container ref
      gsap.from(".box", {
        y: 30,
        opacity: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: "power2.out",
      });
    },
    { scope: container } // Scope selectors to this component only
  );

  return (
    <div ref={container} className="flex flex-col items-center justify-center p-8 border border-white/10 bg-black/20 backdrop-blur-md rounded-2xl max-w-md mx-auto my-8 gap-6">
      <h3 className="text-xl font-bold text-white tracking-wide">GSAP + React 19 Active</h3>
      
      <div className="flex gap-4">
        <div className="box w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
          G
        </div>
        <div className="box w-12 h-12 bg-violet-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/30">
          S
        </div>
        <div className="box w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/30">
          A
        </div>
        <div className="box w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-pink-500/30">
          P
        </div>
      </div>

      <p className="text-sm text-gray-400 text-center">
        This animation is running safely using the <code className="bg-gray-800 px-1 py-0.5 rounded text-pink-400">useGSAP</code> hook with scoping.
      </p>
    </div>
  );
}

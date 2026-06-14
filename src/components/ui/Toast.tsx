"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertCircle, Info } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none w-max max-w-[90vw]">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="pointer-events-auto flex items-center gap-2.5 px-6 py-3.5 rounded-xl border glass shadow-2xl justify-center text-sm font-medium whitespace-pre-line"
              style={{
                borderColor:
                  toast.type === "success"
                    ? "rgba(52,211,153,0.3)"
                    : toast.type === "error"
                    ? "rgba(239,68,68,0.3)"
                    : "rgba(59,130,246,0.3)",
              }}
            >
              {toast.type === "success" && <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
              {toast.type === "error" && <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />}
              {toast.type === "info" && <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />}
              <span className="text-white text-center leading-tight">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

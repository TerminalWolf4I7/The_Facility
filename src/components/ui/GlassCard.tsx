import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "regular" | "strong" | "dark";
  children: React.ReactNode;
}

export default function GlassCard({
  variant = "regular",
  children,
  className = "",
  ...props
}: GlassCardProps) {
  const baseClass =
    variant === "strong"
      ? "glass-strong"
      : variant === "dark"
      ? "glass-dark"
      : "glass";

  return (
    <div
      className={`${baseClass} rounded-2xl transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

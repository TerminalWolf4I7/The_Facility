"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Register useGSAP hook with gsap for cleanup management.
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

export { gsap, useGSAP };
export * from "gsap";

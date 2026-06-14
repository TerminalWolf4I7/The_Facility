import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "Sarabun", "Poppins", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        primary: {
          DEFAULT: "#8b5cf6", // Purple
          dark: "#7c3aed",
        },
        secondary: {
          DEFAULT: "#ec4899", // Pink
          dark: "#db2777",
        },
        dark: {
          100: "#0f0f13",
          200: "#181820",
          300: "#252530",
          400: "#323244",
        },
        emerald: {
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
        teal: {
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
        },
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        },
        magenta: {
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
        },
        yellow: {
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
        },
      },
    },
  },
  plugins: [],
};

export default config;

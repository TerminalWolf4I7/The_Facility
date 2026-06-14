import type { Metadata } from "next";
import { Outfit, Poppins, Sarabun, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
});

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "THE Facility — Secure Online Utilities",
  description: "Secure, client-side encrypted utilities including Clipboard, Word Counter, Speed Reader, and Markdown Converter.",
  keywords: ["clipboard", "e2e encryption", "aes-256", "speed reader", "word counter", "markdown", "rich text"],
  authors: [{ name: "THE Facility" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="dark" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${poppins.variable} ${sarabun.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

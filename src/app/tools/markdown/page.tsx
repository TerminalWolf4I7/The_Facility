"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  ArrowLeft, FileSpreadsheet, Code, FileText, Trash2, 
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, Code2, Minus, Link2, Palette, Check
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Navbar from "@/components/ui/Navbar";
import { useToast } from "@/components/ui/Toast";
import { parseMarkdown, calculateStats, generateRichHtmlForClipboard, MarkdownStats } from "@/lib/markdown-parser";

export default function MarkdownConverterPage() {
  const { showToast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // State
  const [text, setText] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [stats, setStats] = useState<MarkdownStats>({ chars: 0, words: 0, paragraphs: 0, tablesCount: 0 });
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [gridSelection, setGridSelection] = useState({ rows: 1, cols: 1 });

  // Custom table styling colors
  const [thBg, setThBg] = useState("#f1f5f9");
  const [thText, setThText] = useState("#1e293b");
  const [border, setBorder] = useState("#cbd5e1");

  // Presets config
  const presets = {
    neutral: { bg: "#f1f5f9", text: "#1e293b", border: "#cbd5e1" },
    purple: { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe" },
    blue: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
    green: { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
    orange: { bg: "#fff7ed", text: "#c2410c", border: "#ffedd5" }
  };

  // Load saved markdown or default sample on mount
  useEffect(() => {
    const saved = localStorage.getItem("markdown-content");
    const initialText = saved !== null ? saved : `# ตารางข้อมูลตัวอย่าง

| สินค้า | ราคา (บาท) | จำนวน | สถานะ |
| :--- | :---: | :---: | :--- |
| สมุดโน้ตพรีเมียม | 250 | 5 | มีในสต็อก |
| ดินสอกร๊าฟไม้แท้ | 75 | 10 | มีในสต็อก |
| ปากกาหมึกซึมวินเทจ | 1,490 | 1 | สินค้าหมด |

> กดปุ่มสีม่วง **"คัดลอกตารางไป Google Docs"** แล้วนำไปวางใน Google Docs ได้ทันที!`;
    
    setText(initialText);
    const html = parseMarkdown(initialText);
    setPreviewHtml(html);
    setStats(calculateStats(initialText, html));

    // Restore table customizer colors
    setThBg(localStorage.getItem("table-th-bg") || "#f1f5f9");
    setThText(localStorage.getItem("table-th-text") || "#1e293b");
    setBorder(localStorage.getItem("table-border") || "#cbd5e1");
  }, []);

  // Sync color changes to localStorage
  const handleColorChange = (type: "thBg" | "thText" | "border", val: string) => {
    if (type === "thBg") {
      setThBg(val);
      localStorage.setItem("table-th-bg", val);
    } else if (type === "thText") {
      setThText(val);
      localStorage.setItem("table-th-text", val);
    } else if (type === "border") {
      setBorder(val);
      localStorage.setItem("table-border", val);
    }
  };

  const applyPreset = (presetKey: keyof typeof presets) => {
    const p = presets[presetKey];
    setThBg(p.bg);
    setThText(p.text);
    setBorder(p.border);
    localStorage.setItem("table-th-bg", p.bg);
    localStorage.setItem("table-th-text", p.text);
    localStorage.setItem("table-border", p.border);
    showToast(`ใช้ชุดสีตารางธีม ${presetKey} แล้ว`, "info");
  };

  // Handle editor text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    const html = parseMarkdown(val);
    setPreviewHtml(html);
    setStats(calculateStats(val, html));
    localStorage.setItem("markdown-content", val);
  };

  // Actions
  const handleClear = () => {
    setText("");
    setPreviewHtml("");
    setStats({ chars: 0, words: 0, paragraphs: 0, tablesCount: 0 });
    localStorage.removeItem("markdown-content");
    showToast("ล้างข้อมูลเรียบร้อยแล้ว", "info");
  };

  const handleCopyMarkdown = () => {
    if (!text) {
      showToast("ไม่มีข้อความให้คัดลอก", "error");
      return;
    }
    navigator.clipboard.writeText(text)
      .then(() => showToast("คัดลอก Markdown ต้นฉบับสำเร็จ"))
      .catch(() => showToast("ไม่สามารถคัดลอกได้", "error"));
  };

  const handleCopyHtml = () => {
    if (!previewHtml) {
      showToast("ไม่มีรหัส HTML ให้คัดลอก", "error");
      return;
    }
    navigator.clipboard.writeText(previewHtml)
      .then(() => showToast("คัดลอกรหัส HTML โค้ดสำเร็จ"))
      .catch(() => showToast("ไม่สามารถคัดลอกได้", "error"));
  };

  const handleCopyRich = async () => {
    if (!previewHtml) {
      showToast("ไม่มีข้อความให้ส่งออก", "error");
      return;
    }
    const docsHtml = generateRichHtmlForClipboard(previewHtml, thBg, thText, border);
    try {
      const htmlBlob = new Blob([docsHtml], { type: "text/html" });
      const textBlob = new Blob([text], { type: "text/plain" });

      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": htmlBlob,
          "text/plain": textBlob,
        }),
      ]);
      showToast("คัดลอกตาราง Rich Text สำเร็จ! นำไปวางใน Google Docs ได้ทันที");
    } catch (err) {
      console.error("Rich text copy failure:", err);
      showToast("ไม่สามารถคัดลอก Rich Text ได้ คัดลอกแบบข้อความดิบแทน", "error");
    }
  };

  // Keyboard insertions
  const insertShortcut = (type: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selected = currentText.substring(start, end);

    let val = "";
    let offset = 0;

    switch (type) {
      case "bold": val = `**${selected || "ตัวหนา"}**`; offset = selected ? 0 : -2; break;
      case "italic": val = `*${selected || "ตัวเอียง"}*`; offset = selected ? 0 : -1; break;
      case "strike": val = `~~${selected || "ขีดฆ่า"}~~`; offset = selected ? 0 : -2; break;
      case "h1": val = `\n# ${selected || "หัวข้อใหญ่ H1"}\n`; break;
      case "h2": val = `\n## ${selected || "หัวข้อรอง H2"}\n`; break;
      case "h3": val = `\n### ${selected || "หัวข้อย่อย H3"}\n`; break;
      case "ul": val = `\n- ${selected || "รายการแรก"}\n- รายการถัดไป`; break;
      case "ol": val = `\n1. ${selected || "รายการแรก"}\n2. รายการถัดไป`; break;
      case "quote": val = `\n> ${selected || "ข้อความอ้างอิง"}\n`; break;
      case "code": val = `\`${selected || "โค้ด"}\``; offset = selected ? 0 : -1; break;
      case "hr": val = `\n---\n`; break;
      case "link": val = `[${selected || "ข้อความลิงก์"}](https://example.com)`; offset = selected ? 0 : -21; break;
    }

    const newText = currentText.substring(0, start) + val + currentText.substring(end);
    setText(newText);
    const html = parseMarkdown(newText);
    setPreviewHtml(html);
    setStats(calculateStats(newText, html));
    localStorage.setItem("markdown-content", newText);

    setTimeout(() => {
      textarea.focus();
      const nextPos = start + val.length + offset;
      textarea.setSelectionRange(nextPos, nextPos);
    }, 0);
  };

  const insertTableTemplate = (rows: number, cols: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;

    let tableStr = "\n";
    for (let c = 1; c <= cols; c++) tableStr += `| หัวตาราง ${c} `;
    tableStr += "|\n";

    for (let c = 1; c <= cols; c++) tableStr += "| :--- ";
    tableStr += "|\n";

    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) tableStr += `| ข้อมูล ${r}-${c} `;
      tableStr += "|\n";
    }
    tableStr += "\n";

    const newText = currentText.substring(0, start) + tableStr + currentText.substring(end);
    setText(newText);
    const html = parseMarkdown(newText);
    setPreviewHtml(html);
    setStats(calculateStats(newText, html));
    localStorage.setItem("markdown-content", newText);

    setTimeout(() => {
      textarea.focus();
      const nextCursor = start + tableStr.length;
      textarea.setSelectionRange(nextCursor, nextCursor);
    }, 0);
  };

  // Grid hover highlighted details
  const handleGridHover = (r: number, c: number) => {
    setGridSelection({ rows: r, cols: c });
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <Navbar>
        <Link
          href="/"
          className="glass px-4 py-2 rounded-full text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition flex items-center gap-1.5 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          หน้าแรก
        </Link>
      </Navbar>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto pt-28 pb-16 px-6 flex-1 w-full flex flex-col justify-center">
        {/* Dynamic styling override for tables in Preview */}
        <style dangerouslySetInnerHTML={{ __html: `
          .markdown-preview table {
            border-collapse: collapse;
            width: 100%;
            border: 1px solid ${border} !important;
            margin: 15px 0;
            font-family: inherit;
            border-radius: 8px;
            overflow: hidden;
          }
          .markdown-preview th {
            font-weight: 700;
            padding: 10px 14px;
            background-color: ${thBg} !important;
            color: ${thText} !important;
            border: 1px solid ${border} !important;
            text-align: left;
          }
          .markdown-preview td {
            padding: 10px 14px;
            border: 1px solid ${border} !important;
            vertical-align: top;
          }
          .markdown-preview tr:hover {
            background-color: rgba(139, 92, 246, 0.03);
          }
          .markdown-preview blockquote {
            border-left: 4px solid #8b5cf6;
            padding-left: 1rem;
            margin: 1.2rem 0;
            font-style: italic;
            background-color: rgba(139, 92, 246, 0.05);
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
            border-radius: 0 8px 8px 0;
          }
          .markdown-preview p { margin-bottom: 1rem; line-height: 1.7; }
          .markdown-preview h1 { font-size: 1.8rem; font-weight: 800; margin: 1.5rem 0 0.8rem; line-height: 1.3; }
          .markdown-preview h2 { font-size: 1.45rem; font-weight: 700; margin: 1.3rem 0 0.7rem; }
          .markdown-preview h3 { font-size: 1.2rem; font-weight: 600; margin: 1.1rem 0 0.6rem; }
          .markdown-preview code {
            background-color: rgba(236, 72, 153, 0.12);
            color: #f472b6;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-size: 0.9em;
            font-family: monospace;
          }
          .markdown-preview pre {
            background-color: #0f0f13 !important;
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
            margin: 1.2rem 0;
            border: 1px solid rgba(255,255,255,0.05);
          }
          .markdown-preview pre code {
            background-color: transparent !important;
            color: inherit !important;
            padding: 0;
          }
        ` }} />

        <GlassCard className="p-6 sm:p-8 backdrop-blur-2xl relative overflow-hidden bg-white/5 border-white/5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500" />

          {/* Heading */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400">
              Markdown to Rich Text Converter
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              แปลงรหัส Markdown เป็น Rich Text เพื่อคัดลอกตารางไปวางใน Google Docs ได้โดยตรงอย่างเรียบร้อย
            </p>
          </div>

          {/* Toolbar and Settings */}
          <div className="flex flex-col gap-4 mb-6 relative z-30">
            {/* Editor formatting keys */}
            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-black/30 border border-white/5 items-center select-none">
              <button onClick={() => insertShortcut("bold")} title="ตัวหนา" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-300 font-bold text-xs"><Bold className="w-3.5 h-3.5" /></button>
              <button onClick={() => insertShortcut("italic")} title="ตัวเอียง" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-300 italic text-xs"><Italic className="w-3.5 h-3.5" /></button>
              <button onClick={() => insertShortcut("strike")} title="ขีดฆ่า" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-300 line-through text-xs"><Strikethrough className="w-3.5 h-3.5" /></button>
              
              <div className="w-px h-4 bg-white/10 mx-1" />
              
              <button onClick={() => insertShortcut("h1")} title="H1" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-300 text-xs font-black"><Heading1 className="w-3.5 h-3.5" /></button>
              <button onClick={() => insertShortcut("h2")} title="H2" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-300 text-xs font-black"><Heading2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => insertShortcut("h3")} title="H3" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-300 text-xs font-black"><Heading3 className="w-3.5 h-3.5" /></button>
              
              <div className="w-px h-4 bg-white/10 mx-1" />
              
              <button onClick={() => insertShortcut("ul")} title="List" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-300"><List className="w-3.5 h-3.5" /></button>
              <button onClick={() => insertShortcut("ol")} title="Ordered List" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-300"><ListOrdered className="w-3.5 h-3.5" /></button>
              <button onClick={() => insertShortcut("quote")} title="Blockquote" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-300"><Quote className="w-3.5 h-3.5" /></button>
              <button onClick={() => insertShortcut("code")} title="Code" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-300"><Code2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => insertShortcut("hr")} title="Divider" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-300"><Minus className="w-3.5 h-3.5" /></button>
              <button onClick={() => insertShortcut("link")} title="Link" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-300"><Link2 className="w-3.5 h-3.5" /></button>

              <div className="w-px h-4 bg-white/10 mx-1" />

              {/* Dynamic Grid Table Generator */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="px-2.5 h-8 flex items-center gap-1 rounded-lg hover:bg-white/10 text-slate-300 text-xs font-semibold select-none cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>ตาราง</span>
                </button>

                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                    <div className="absolute top-10 left-0 z-50 p-4 rounded-xl glass-dark border border-white/10 shadow-2xl min-w-[190px]">
                      <h4 className="text-[10px] font-bold text-slate-400 mb-2">เลือกขนาดตาราง (แถว x คอลัมน์)</h4>
                      <div className="grid grid-cols-5 gap-1.5 mb-3">
                        {[1, 2, 3, 4, 5].map((r) =>
                          [1, 2, 3, 4, 5].map((c) => {
                            const isSelected = r <= gridSelection.rows && c <= gridSelection.cols;
                            return (
                              <div
                                key={`${r}-${c}`}
                                onMouseEnter={() => handleGridHover(r, c)}
                                onClick={() => {
                                  insertTableTemplate(r, c);
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-5 h-5 rounded border cursor-pointer transition ${
                                  isSelected
                                    ? "bg-purple-500 border-purple-600"
                                    : "bg-white/5 border-white/10 hover:bg-white/15"
                                }`}
                              />
                            );
                          })
                        )}
                      </div>
                      <div className="text-[10px] text-center font-bold text-purple-400 mb-2">
                        {gridSelection.rows} แถว x {gridSelection.cols} คอลัมน์
                      </div>
                      <button
                        onClick={() => {
                          insertTableTemplate(3, 3);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-center py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded text-[10px] font-bold"
                      >
                        ขนาดเริ่มต้น (3x3)
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleClear}
                title="ล้างข้อมูลทั้งหมด"
                className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-500/10 text-rose-500 transition active:scale-90"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Custom Table Color Picker Panel */}
            <div className="p-3.5 rounded-xl bg-black/20 border border-white/5 flex flex-wrap items-center gap-4">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-purple-400" />
                ปรับแต่งสีตาราง:
              </span>

              <div className="flex flex-wrap items-center gap-1">
                {(Object.keys(presets) as Array<keyof typeof presets>).map((key) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className="px-2.5 py-1 text-[10px] rounded bg-white/5 hover:bg-white/10 text-slate-300 font-semibold border border-white/5 active:scale-95 transition"
                  >
                    {key === "neutral" ? "Neutral" : key.charAt(0).toUpperCase() + key.slice(1)}
                  </button>
                ))}
              </div>

              {/* Color selectors */}
              <div className="flex flex-wrap items-center gap-4 ml-auto sm:ml-0">
                <label className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-400 cursor-pointer">
                  <span>พื้นหลังหัวข้อ</span>
                  <input
                    type="color"
                    value={thBg}
                    onChange={(e) => handleColorChange("thBg", e.target.value)}
                    className="w-5 h-5 p-0 border-0 rounded cursor-pointer bg-transparent"
                  />
                </label>
                <label className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-400 cursor-pointer">
                  <span>ตัวอักษรหัวข้อ</span>
                  <input
                    type="color"
                    value={thText}
                    onChange={(e) => handleColorChange("thText", e.target.value)}
                    className="w-5 h-5 p-0 border-0 rounded cursor-pointer bg-transparent"
                  />
                </label>
                <label className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-400 cursor-pointer">
                  <span>เส้นขอบ</span>
                  <input
                    type="color"
                    value={border}
                    onChange={(e) => handleColorChange("border", e.target.value)}
                    className="w-5 h-5 p-0 border-0 rounded cursor-pointer bg-transparent"
                  />
                </label>
              </div>
            </div>

            {/* Export and action triggers */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleCopyRich}
                className="flex-1 sm:flex-initial bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 active:scale-95 text-white px-5 py-2 rounded-full flex items-center justify-center gap-1.5 text-xs font-bold shadow-lg shadow-purple-500/10 cursor-pointer transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>คัดลอกตารางไป Google Docs</span>
              </button>
              <button
                onClick={handleCopyHtml}
                className="px-4 py-2 text-xs font-bold rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <Code className="w-3.5 h-3.5" />
                <span>คัดลอก HTML Code</span>
              </button>
              <button
                onClick={handleCopyMarkdown}
                className="px-4 py-2 text-xs font-bold rounded-full bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 border border-slate-500/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>คัดลอก Markdown ดิบ</span>
              </button>
            </div>
          </div>

          {/* Responsive split tab menu */}
          <div className="flex md:hidden gap-2 mb-4">
            <button
              onClick={() => setActiveTab("edit")}
              className={`flex-1 py-2 text-center font-bold text-xs rounded-lg border ${
                activeTab === "edit"
                  ? "bg-purple-500/10 border-purple-500/35 text-purple-400"
                  : "bg-black/25 border-white/5 text-slate-500"
              }`}
            >
              แก้ไข (Markdown)
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex-1 py-2 text-center font-bold text-xs rounded-lg border ${
                activeTab === "preview"
                  ? "bg-purple-500/10 border-purple-500/35 text-purple-400"
                  : "bg-black/25 border-white/5 text-slate-500"
              }`}
            >
              พรีวิว (Rich Text)
            </button>
          </div>

          {/* Workspaces Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-text">
            {/* Editor panel */}
            <div className={`flex flex-col gap-2 ${activeTab !== "edit" ? "hidden md:flex" : "flex"}`}>
              <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-purple-400 uppercase">
                <span className="w-1.5 h-3 bg-purple-500 rounded-full" />
                Markdown Editor
              </div>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                placeholder="ป้อนรหัส Markdown ที่นี่..."
                className="w-full h-96 sm:h-[450px] p-4 rounded-xl glass-dark border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm font-mono leading-relaxed resize-none"
              />
            </div>

            {/* Preview panel */}
            <div className={`flex flex-col gap-2 ${activeTab !== "preview" ? "hidden md:flex" : "flex"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-pink-400 uppercase">
                  <span className="w-1.5 h-3 bg-pink-500 rounded-full" />
                  Rich Text Preview
                </div>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Live Render
                </span>
              </div>
              <div
                dangerouslySetInnerHTML={{ __html: previewHtml }}
                className="markdown-preview w-full h-96 sm:h-[450px] p-4 rounded-xl glass-dark border border-white/5 text-slate-200 overflow-y-auto leading-relaxed select-text select-all"
              />
            </div>
          </div>

          {/* Bottom stats details */}
          <div className="mt-6 p-4 rounded-xl bg-black/20 border border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">ตัวอักษรทั้งหมด</div>
              <div className="text-base font-extrabold text-purple-400">{stats.chars.toLocaleString()}</div>
            </div>
            <div className="border-l border-white/5">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">จำนวนคำ</div>
              <div className="text-base font-extrabold text-indigo-400">{stats.words.toLocaleString()}</div>
            </div>
            <div className="border-l border-white/5">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">จำนวนย่อหน้า</div>
              <div className="text-base font-extrabold text-pink-400">{stats.paragraphs.toLocaleString()}</div>
            </div>
            <div className="border-l border-white/5">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">ตารางที่พบ</div>
              <div className="text-base font-extrabold text-rose-400">{stats.tablesCount.toLocaleString()}</div>
            </div>
          </div>
        </GlassCard>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-xs text-white/40 border-t border-white/5 bg-black/10">
        <p>© {new Date().getFullYear()} Markdown Converter | THE Facility</p>
      </footer>
    </div>
  );
}

import { marked } from "marked";
import DOMPurify from "dompurify";

export function parseMarkdown(markdownText: string): string {
  if (!markdownText) return "";

  try {
    const rawHtml = marked.parse(markdownText) as string;
    
    // Check if we are running in browser context for DOMPurify
    if (typeof window !== "undefined") {
      return DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "strong", "em",
          "code", "pre", "blockquote", "ul", "ol", "li", "table", "thead",
          "tbody", "tr", "th", "td", "a", "img", "hr", "del", "sup", "sub"
        ],
        ALLOWED_ATTR: ["href", "src", "alt", "class", "id", "target", "rel"],
        ALLOW_DATA_ATTR: false,
      });
    }
    
    return rawHtml; // SSR fallback
  } catch (e) {
    console.error("Marked parsing error:", e);
    return `<div class="text-rose-500">เกิดข้อผิดพลาดในการประมวลผลข้อความ</div>`;
  }
}

export interface MarkdownStats {
  chars: number;
  words: number;
  paragraphs: number;
  tablesCount: number;
}

export function calculateStats(text: string, previewHtml: string): MarkdownStats {
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const paragraphs = text.trim() ? text.split(/\n{2,}/).filter((p) => p.trim() !== "").length : 0;

  let tablesCount = 0;
  if (previewHtml && typeof document !== "undefined") {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = previewHtml;
    tablesCount = tempDiv.querySelectorAll("table").length;
  }

  return { chars, words, paragraphs, tablesCount };
}

export function generateRichHtmlForClipboard(
  previewHtml: string,
  thBg: string,
  thText: string,
  border: string
): string {
  if (typeof document === "undefined") return previewHtml;

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = previewHtml;

  const finalThBg = thBg || "#f1f5f9";
  const finalThText = thText || "#1e293b";
  const finalBorder = border || "#cbd5e1";

  // 1. Style tables
  tempDiv.querySelectorAll("table").forEach((table) => {
    table.setAttribute(
      "style",
      `border-collapse: collapse; width: 100%; border: 1px solid ${finalBorder}; margin: 15px 0; font-family: Arial, sans-serif;`
    );
  });

  // 2. Style th (header cells)
  tempDiv.querySelectorAll("th").forEach((th) => {
    th.setAttribute(
      "style",
      `border: 1px solid ${finalBorder}; padding: 10px 14px; background-color: ${finalThBg}; color: ${finalThText}; font-weight: bold; text-align: left;`
    );
  });

  // 3. Style td (body cells)
  tempDiv.querySelectorAll("td").forEach((td) => {
    td.setAttribute(
      "style",
      `border: 1px solid ${finalBorder}; padding: 10px 14px; color: #334155; vertical-align: top;`
    );
  });

  // 4. Style blockquote
  tempDiv.querySelectorAll("blockquote").forEach((bq) => {
    bq.setAttribute(
      "style",
      "border-left: 4px solid #8b5cf6; padding-left: 14px; margin: 14px 0; font-style: italic; color: #475569; background-color: #f8fafc;"
    );
  });

  // 5. Style inline code
  tempDiv.querySelectorAll("code").forEach((code) => {
    if (code.parentNode?.nodeName !== "PRE") {
      code.setAttribute(
        "style",
        "background-color: #fce7f3; color: #db2777; padding: 2px 5px; border-radius: 4px; font-family: monospace; font-size: 0.9em;"
      );
    }
  });

  // 6. Style pre
  tempDiv.querySelectorAll("pre").forEach((pre) => {
    pre.setAttribute(
      "style",
      "background-color: #0f0f13; color: #f8fafc; padding: 12px; border-radius: 8px; font-family: monospace; overflow-x: auto; margin: 15px 0;"
    );
  });

  return tempDiv.innerHTML;
}

export interface WordStats {
  chars: number;
  noSpaces: number;
  words: number;
  lines: number;
  sentences: number;
  paragraphs: number;
  unique: number;
  avgLen: number;
  minutesToRead: number;
  secondsToRead: number;
}

export function countWordsLogic(text: string): number {
  return !text.trim() ? 0 : text.trim().split(/\s+/).length;
}

export function countUniqueWordsLogic(text: string): number {
  return !text.trim() ? 0 : new Set(text.toLowerCase().trim().match(/\b(\w+)\b/g) || []).size;
}

export function countSentencesLogic(text: string): number {
  return !text.trim() ? 0 : (text.match(/[.!?…]+(\s+|$)/g) || []).length;
}

export function countParagraphsLogic(text: string): number {
  return !text.trim() ? 1 : text.split(/\n{2,}/).filter(p => p.trim() !== "").length;
}

export function calculateAllStats(text: string): WordStats {
  const chars = text.length;
  const noSpaces = text.replace(/\s/g, "").length;
  const words = countWordsLogic(text);
  const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
  const sentences = countSentencesLogic(text);
  const paragraphs = countParagraphsLogic(text);
  const unique = countUniqueWordsLogic(text);

  const avgLen = words > 0 ? noSpaces / words : 0;
  const readingSpeedWPM = 200;
  const minutesToRead = words / readingSpeedWPM;
  const secondsToRead = minutesToRead * 60;

  return {
    chars,
    noSpaces,
    words,
    lines,
    sentences,
    paragraphs,
    unique,
    avgLen,
    minutesToRead,
    secondsToRead: Math.max(0, Math.ceil(secondsToRead)),
  };
}

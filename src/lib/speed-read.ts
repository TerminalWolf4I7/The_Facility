export function segmentText(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Check if Intl.Segmenter is supported (works natively in modern browsers and Node)
  if (typeof Intl !== "undefined" && typeof (Intl as any).Segmenter !== "undefined") {
    try {
      const segmenter = new (Intl as any).Segmenter("th", { granularity: "word" });
      return Array.from(segmenter.segment(trimmed))
        .map((seg: any) => seg.segment.trim())
        .filter((word) => word.length > 0);
    } catch (error) {
      console.warn("Intl.Segmenter failed, falling back to regex split:", error);
    }
  }

  // Fallback regex split for environments where Intl.Segmenter is unavailable
  const splitPattern = /[\s.,;:!?()\[\]{}"'\-+=_<>\|\\~`@#$%^&*]+/;
  return trimmed.split(splitPattern).filter((word) => word.trim().length > 0);
}

export function prepareTextForSpeech(value: string, maxLength = 900) {
  const cleaned = value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\b(?:task|action|project)[ _-]?id:\s*\S+/gi, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*•]\s*/gm, "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/[✓✗○🔴🟠🟡⚪]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length <= maxLength) return cleaned;
  const cut = cleaned.slice(0, maxLength).lastIndexOf(". ");
  return `${cleaned.slice(0, cut > 100 ? cut + 1 : maxLength).trim()}…`;
}

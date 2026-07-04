/**
 * Formats an ISO date string into a friendly, locale-agnostic format (e.g., "Jul 4, 2026").
 * This avoids hydration errors in Next.js/React caused by timezone or locale mismatches.
 */
export function formatFriendlyDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  
  // Try to parse out the date portion (YYYY-MM-DD)
  const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const parts = datePart.split("-");
  
  if (parts.length !== 3) {
    // Fallback if the date format is different
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
    } catch {
      return dateStr;
    }
  }
  
  const [year, month, day] = parts;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mIdx = parseInt(month, 10) - 1;
  return `${months[mIdx] || month} ${parseInt(day, 10)}, ${year}`;
}

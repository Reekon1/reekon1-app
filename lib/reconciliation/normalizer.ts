/**
 * Normalize a string value for key comparison.
 * Trims whitespace, normalizes unicode, collapses spaces.
 */
export function normalizeKey(value: string): string {
  return value
    .normalize("NFC")
    .trim()
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * Build a composite key from multiple column values.
 */
export function buildKey(row: string[], columnIndices: number[]): string {
  return columnIndices.map((i) => normalizeKey(row[i] ?? "")).join("||");
}

/**
 * Parse a string amount to a number.
 * Handles French formatting (1 234,56), thousand separators, negative values.
 * Returns the absolute value for comparison.
 */
export function parseAmount(value: string): number {
  if (!value || !value.trim()) return 0;

  let cleaned = value.trim();

  // Remove currency symbols and whitespace-like chars
  cleaned = cleaned.replace(/[€$£\u00a0\u202f]/g, "");

  // Remove spaces (thousand separators)
  cleaned = cleaned.replace(/\s/g, "");

  // Handle French format: 1.234,56 → 1234.56
  // If there's a comma AND dots before it, dots are thousand separators
  if (cleaned.includes(",") && cleaned.indexOf(".") < cleaned.lastIndexOf(",")) {
    cleaned = cleaned.replace(/\./g, "");
    cleaned = cleaned.replace(",", ".");
  }
  // If there's a comma but no dot, comma is decimal separator
  else if (cleaned.includes(",") && !cleaned.includes(".")) {
    cleaned = cleaned.replace(",", ".");
  }
  // If there's a dot AND commas before it, commas are thousand separators
  else if (cleaned.includes(".") && cleaned.indexOf(",") < cleaned.lastIndexOf(".")) {
    cleaned = cleaned.replace(/,/g, "");
  }

  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;

  return Math.abs(num);
}

/**
 * Apply row exclusions (header/footer lines to skip).
 */
export function applyExclusions(
  rows: string[][],
  excludeHeader: number,
  excludeFooter: number
): string[][] {
  const start = excludeHeader;
  const end = excludeFooter > 0 ? rows.length - excludeFooter : rows.length;
  if (start >= end) return [];
  return rows.slice(start, end);
}

/**
 * Deduplicate rows by key. Keeps the first occurrence.
 * Returns [deduplicatedRows, duplicateCount].
 */
export function deduplicateRows(
  rows: string[][],
  keyColumnIndices: number[]
): [string[][], number] {
  const seen = new Set<string>();
  const unique: string[][] = [];
  let duplicates = 0;

  for (const row of rows) {
    const key = buildKey(row, keyColumnIndices);
    if (seen.has(key)) {
      duplicates++;
    } else {
      seen.add(key);
      unique.push(row);
    }
  }

  return [unique, duplicates];
}

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

function applyAlphanumericOnly(value: string): string {
  return normalizeKey(value).replace(/[^a-z0-9]/g, "");
}

function applyExtractCodePrefix(value: string): string {
  const normalized = normalizeKey(value);
  const match = normalized.match(/^(.*?)\s+[–—-]\s+/);
  return match ? match[1].trim() : normalized;
}

function applyAbsoluteAmount(value: string): string {
  return parseAmount(value).toFixed(2);
}

export function applyTransform(value: string, transform: import("./types").KeyTransform): string {
  switch (transform) {
    case "alphanumeric_only":
      return applyAlphanumericOnly(value);
    case "extract_code_prefix":
      return applyExtractCodePrefix(value);
    case "absolute_amount":
      return applyAbsoluteAmount(value);
    case "default":
    default:
      return normalizeKey(value);
  }
}

export function buildKeyWithTransforms(
  row: string[],
  columnIndices: number[],
  transforms?: import("./types").KeyTransform[],
  separator: string = "||"
): string {
  return columnIndices
    .map((colIdx, pos) => {
      const transform = transforms?.[pos] ?? "default";
      return applyTransform(row[colIdx] ?? "", transform);
    })
    .join(separator);
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
 * Convert legacy flat-array key config to KeyMapping[].
 * Throws if array lengths don't match.
 */
export function legacyToKeyMappings(
  keyColumnsA: number[],
  keyColumnsB: number[],
  keyTransforms?: import("./types").KeyTransform[],
  keySeparator?: string
): import("./types").KeyMapping[] {
  if (keyColumnsA.length !== keyColumnsB.length) {
    throw new Error(
      `Mismatched key column arrays: A=${keyColumnsA.length}, B=${keyColumnsB.length}`
    );
  }
  return keyColumnsA.map((colA, i) => ({
    colsA: [colA],
    colsB: [keyColumnsB[i]],
    separator: keySeparator ?? "",
    transform: keyTransforms?.[i] ?? "default",
  }));
}

/**
 * Build a reconciliation key from KeyMapping[] for one side of the data.
 * Each mapping's columns are joined with its separator, then all mappings
 * are joined with ASCII Unit Separator (\x1F) which never appears in data.
 */
export function buildKeyFromMappings(
  row: string[],
  mappings: import("./types").KeyMapping[],
  side: "A" | "B"
): string {
  return mappings
    .map((m) => {
      const cols = side === "A" ? m.colsA : m.colsB;
      if (cols.length === 0) {
        throw new Error("KeyMapping has no columns for side " + side);
      }
      const parts = cols.map((colIdx) => applyTransform(row[colIdx] ?? "", m.transform));
      const perGap = side === "A" ? m.separatorsA : m.separatorsB;
      if (perGap && perGap.length >= parts.length - 1) {
        let joined = parts[0];
        for (let i = 1; i < parts.length; i++) {
          joined += perGap[i - 1] + parts[i];
        }
        return joined;
      }
      return parts.join(m.separator);
    })
    .join("\x1F");
}

/**
 * Deduplicate rows by key. Keeps the first occurrence.
 * Returns [deduplicatedRows, duplicateCount].
 */
export function deduplicateRows(
  rows: string[][],
  mappings: import("./types").KeyMapping[],
  side: "A" | "B"
): [string[][], number] {
  const seen = new Set<string>();
  const unique: string[][] = [];
  let duplicates = 0;

  for (const row of rows) {
    const key = buildKeyFromMappings(row, mappings, side);
    if (seen.has(key)) {
      duplicates++;
    } else {
      seen.add(key);
      unique.push(row);
    }
  }

  return [unique, duplicates];
}

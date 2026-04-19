import type { UniqueRow } from "./types";
import { normalizeKey } from "./normalizer";

export interface SimilaritySuggestion {
  indexA: number;
  indexB: number;
  keyA: string;
  keyB: string;
  similarity: number;
}

/**
 * Levenshtein distance.
 */
function levenshteinDistance(a: string, b: string): number {
  const lenA = a.length;
  const lenB = b.length;

  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;

  let prev = new Array(lenB + 1);
  let curr = new Array(lenB + 1);

  for (let j = 0; j <= lenB; j++) prev[j] = j;

  for (let i = 1; i <= lenA; i++) {
    curr[0] = i;

    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
    }

    [prev, curr] = [curr, prev];
  }

  return prev[lenB];
}

/**
 * Returns similarity percentage 0-100.
 */
export function similarity(a: string, b: string): number {
  if (a === b) return 100;
  if (a.length === 0 && b.length === 0) return 100;
  if (a.length === 0 || b.length === 0) return 0;

  const maxLen = Math.max(a.length, b.length);
  const dist = levenshteinDistance(a, b);
  return Math.round((1 - dist / maxLen) * 100);
}

// Cap the concatenated row length to keep Levenshtein O(n*m) tractable.
// At 150 chars, worst case per pair is 150² = 22_500 ops; with 100k pairs
// that is well under a second on typical data thanks to early termination.
const MAX_ROW_CONCAT_LENGTH = 150;

/**
 * Concatenate all cells of a row with a neutral separator and normalize.
 * Uses ASCII Unit Separator (\x1F) which never appears in CSV data.
 * Truncates to MAX_ROW_CONCAT_LENGTH to bound similarity compute cost.
 */
export function concatRow(row: string[]): string {
  const joined = row.map((cell) => normalizeKey(cell ?? "")).join("\x1F");
  return joined.length <= MAX_ROW_CONCAT_LENGTH
    ? joined
    : joined.slice(0, MAX_ROW_CONCAT_LENGTH);
}

/**
 * Compute suggestions without blocking the UI thread.
 *
 * Similarity is computed on the full row (all cells concatenated). Keys are
 * not used for scoring — they are only carried through for display/export.
 *
 * Strategy:
 * - Iterate the SMALLER side as primary so the total number of suggestions
 *   is bounded by min(A.length, B.length) — the max number of 1:1 pairs
 *   the user could ever accept.
 * - For each primary row, keep only the best match on the other side
 *   (maxSuggestionsPerRow, defaults to 1).
 * - A suggestion is kept if similarity >= minSimilarity, sorted desc.
 * - Yields to the UI ~30 times during the primary loop so progress updates
 *   and the user can interact.
 */
export async function computeSuggestionsAsync(
  uniqueA: UniqueRow[],
  uniqueB: UniqueRow[],
  onProgress?: (current: number, total: number) => void,
  options: { minSimilarity?: number; maxSuggestionsPerRow?: number } = {}
): Promise<SimilaritySuggestion[]> {
  const minSim = options.minSimilarity ?? 0;
  const maxPerRow = options.maxSuggestionsPerRow ?? 1;

  const aSmaller = uniqueA.length <= uniqueB.length;
  const primary = aSmaller ? uniqueA : uniqueB;
  const secondary = aSmaller ? uniqueB : uniqueA;

  if (primary.length === 0 || secondary.length === 0) {
    onProgress?.(0, 0);
    return [];
  }

  const primaryRowStrs = primary.map((u) => concatRow(u.row));
  const secondaryRowStrs = secondary.map((u) => concatRow(u.row));

  const suggestions: SimilaritySuggestion[] = [];
  const yieldEvery = Math.max(1, Math.floor(primary.length / 30));

  for (let ip = 0; ip < primary.length; ip++) {
    const rowP = primaryRowStrs[ip];
    let best: SimilaritySuggestion | null = null;
    const rowSuggestions: SimilaritySuggestion[] = [];

    for (let is = 0; is < secondary.length; is++) {
      const rowS = secondaryRowStrs[is];
      const sim = similarity(rowP, rowS);

      if (sim < minSim) continue;

      const suggestion: SimilaritySuggestion = {
        indexA: aSmaller ? ip : is,
        indexB: aSmaller ? is : ip,
        keyA: aSmaller ? primary[ip].key : secondary[is].key,
        keyB: aSmaller ? secondary[is].key : primary[ip].key,
        similarity: sim,
      };

      if (maxPerRow === 1) {
        if (!best || suggestion.similarity > best.similarity) {
          best = suggestion;
        }
      } else {
        rowSuggestions.push(suggestion);
      }
    }

    if (maxPerRow === 1) {
      if (best) suggestions.push(best);
    } else {
      rowSuggestions.sort((a, b) => b.similarity - a.similarity);
      suggestions.push(...rowSuggestions.slice(0, maxPerRow));
    }

    if ((ip + 1) % yieldEvery === 0 || ip === primary.length - 1) {
      onProgress?.(ip + 1, primary.length);
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  suggestions.sort((a, b) => b.similarity - a.similarity);
  return suggestions;
}

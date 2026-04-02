import type { UniqueRow } from "./types";

export interface SimilaritySuggestion {
  indexA: number;
  indexB: number;
  keyA: string;
  keyB: string;
  similarity: number;
}

/**
 * Levenshtein distance with early termination.
 */
function levenshteinDistance(a: string, b: string, maxDistance?: number): number {
  const lenA = a.length;
  const lenB = b.length;

  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;

  if (maxDistance !== undefined && Math.abs(lenA - lenB) > maxDistance) {
    return maxDistance + 1;
  }

  // Use single-row optimization
  let prev = new Array(lenB + 1);
  let curr = new Array(lenB + 1);

  for (let j = 0; j <= lenB; j++) prev[j] = j;

  for (let i = 1; i <= lenA; i++) {
    curr[0] = i;
    let rowMin = curr[0];

    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,      // deletion
        curr[j - 1] + 1,  // insertion
        prev[j - 1] + cost // substitution
      );
      if (curr[j] < rowMin) rowMin = curr[j];
    }

    // Early termination: if minimum in this row exceeds maxDistance, abort
    if (maxDistance !== undefined && rowMin > maxDistance) {
      return maxDistance + 1;
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
  // Early termination at 40% threshold
  const maxDist = Math.floor(maxLen * 0.6);
  const dist = levenshteinDistance(a, b, maxDist);

  if (dist > maxDist) return 0; // Below 40% threshold
  return Math.round((1 - dist / maxLen) * 100);
}

/**
 * Compute suggestions in batches to avoid blocking the UI thread.
 * Calls onProgress with the current progress (0-100).
 */
export async function computeSuggestionsAsync(
  uniqueA: UniqueRow[],
  uniqueB: UniqueRow[],
  onProgress?: (current: number, total: number) => void,
  options: { minSimilarity?: number; maxSuggestionsPerRow?: number } = {}
): Promise<SimilaritySuggestion[]> {
  const minSim = options.minSimilarity ?? 40;
  const maxPerRow = options.maxSuggestionsPerRow ?? 5;
  const suggestions: SimilaritySuggestion[] = [];
  const batchSize = 100;

  for (let ia = 0; ia < uniqueA.length; ia++) {
    const keyA = uniqueA[ia].key;
    const rowSuggestions: SimilaritySuggestion[] = [];

    for (let ib = 0; ib < uniqueB.length; ib++) {
      const keyB = uniqueB[ib].key;
      const sim = similarity(keyA, keyB);

      if (sim >= minSim) {
        rowSuggestions.push({
          indexA: ia,
          indexB: ib,
          keyA,
          keyB,
          similarity: sim,
        });
      }
    }

    rowSuggestions.sort((a, b) => b.similarity - a.similarity);
    suggestions.push(...rowSuggestions.slice(0, maxPerRow));

    // Yield to UI thread every batchSize rows
    if ((ia + 1) % batchSize === 0) {
      onProgress?.(ia + 1, uniqueA.length);
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  onProgress?.(uniqueA.length, uniqueA.length);
  suggestions.sort((a, b) => b.similarity - a.similarity);
  return suggestions;
}

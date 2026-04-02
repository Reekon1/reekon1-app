import type {
  ParsedFile,
  ReconciliationConfig,
  ReconciliationResult,
  MatchedRow,
  VarianceRow,
  UniqueRow,
} from "./types";
import {
  buildKeyFromMappings,
  parseAmount,
  applyExclusions,
  deduplicateRows,
} from "./normalizer";

export function reconcile(
  fileA: ParsedFile,
  fileB: ParsedFile,
  config: ReconciliationConfig
): ReconciliationResult {
  const { keyMappings } = config;

  // 1. Apply exclusions
  let rowsA = applyExclusions(
    fileA.rows,
    config.excludeHeaderRowsA,
    config.excludeFooterRowsA
  );
  let rowsB = applyExclusions(
    fileB.rows,
    config.excludeHeaderRowsB,
    config.excludeFooterRowsB
  );

  // 2. Deduplication
  let duplicatesA = 0;
  let duplicatesB = 0;

  if (config.deduplication) {
    [rowsA, duplicatesA] = deduplicateRows(rowsA, keyMappings, "A");
    [rowsB, duplicatesB] = deduplicateRows(rowsB, keyMappings, "B");
  }

  const totalA = rowsA.length;
  const totalB = rowsB.length;

  // 3. Build key maps
  const mapA = new Map<string, string[][]>();
  for (const row of rowsA) {
    const key = buildKeyFromMappings(row, keyMappings, "A");
    if (!mapA.has(key)) mapA.set(key, []);
    mapA.get(key)!.push(row);
  }

  const mapB = new Map<string, string[][]>();
  for (const row of rowsB) {
    const key = buildKeyFromMappings(row, keyMappings, "B");
    if (!mapB.has(key)) mapB.set(key, []);
    mapB.get(key)!.push(row);
  }

  // 4. Bidirectional matching
  const matches: MatchedRow[] = [];
  const amountVariances: VarianceRow[] = [];
  const uniqueA: UniqueRow[] = [];
  const uniqueB: UniqueRow[] = [];
  const matchedKeysB = new Set<string>();

  const hasAmounts =
    config.amountColumnA !== null && config.amountColumnB !== null;

  for (const [key, rowsOfA] of mapA) {
    const rowsOfB = mapB.get(key);

    if (!rowsOfB || rowsOfB.length === 0) {
      // Unique to A
      for (const row of rowsOfA) {
        uniqueA.push({ key, row });
      }
    } else {
      matchedKeysB.add(key);
      const rowA = rowsOfA[0];
      const rowB = rowsOfB[0];

      if (hasAmounts) {
        const amountA = parseAmount(rowA[config.amountColumnA!] ?? "");
        const amountB = parseAmount(rowB[config.amountColumnB!] ?? "");
        const variance = amountA - amountB;

        if (Math.abs(variance) < 0.005) {
          matches.push({ key, rowA, rowB });
        } else {
          amountVariances.push({ key, rowA, rowB, amountA, amountB, variance });
        }
      } else {
        matches.push({ key, rowA, rowB });
      }
    }
  }

  // Keys in B not matched by A
  for (const [key, rowsOfB] of mapB) {
    if (!matchedKeysB.has(key)) {
      for (const row of rowsOfB) {
        uniqueB.push({ key, row });
      }
    }
  }

  // Sort variances by absolute variance descending
  amountVariances.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

  // 5. Summary
  const totalMatched = matches.length + amountVariances.length;
  const matchRate =
    totalA + totalB > 0
      ? (totalMatched * 2) / (totalA + totalB)
      : 0;

  return {
    summary: {
      totalA,
      totalB,
      exactMatches: matches.length,
      amountVariances: amountVariances.length,
      uniqueA: uniqueA.length,
      uniqueB: uniqueB.length,
      matchRate: Math.round(matchRate * 10000) / 100,
      duplicatesA,
      duplicatesB,
      manualMatches: 0,
    },
    matches,
    amountVariances,
    uniqueA,
    uniqueB,
  };
}

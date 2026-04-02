export interface ParseWarning {
  message: string;
  errorCount: number;
  expectedRows: number;
  actualRows: number;
}

export interface RawParsedFile {
  fileName: string;
  rawRows: string[][];
  totalColumns: number;
  warnings?: ParseWarning[];
  sheetNames?: string[];
  detectedEncoding?: string;
}

export interface ParsedFile {
  fileName: string;
  headers: string[];
  rows: string[][];
  totalRows: number;
  totalColumns: number;
}

export function toParsedFile(raw: RawParsedFile, headerRowIndex: number): ParsedFile {
  const headers =
    headerRowIndex < raw.rawRows.length
      ? raw.rawRows[headerRowIndex].map(String)
      : [];
  const rows = raw.rawRows.slice(headerRowIndex + 1).map((r) => r.map(String));
  return {
    fileName: raw.fileName,
    headers,
    rows,
    totalRows: rows.length,
    totalColumns: headers.length,
  };
}

export type KeyTransform =
  | "default"
  | "alphanumeric_only"
  | "extract_code_prefix"
  | "absolute_amount";

export interface ReconciliationConfig {
  keyColumnsA: number[];
  keyColumnsB: number[];
  amountColumnA: number | null;
  amountColumnB: number | null;
  excludeHeaderRowsA: number;
  excludeHeaderRowsB: number;
  excludeFooterRowsA: number;
  excludeFooterRowsB: number;
  deduplication: boolean;
  keyTransforms?: KeyTransform[];
  keySeparator?: string;
}

export interface ReconciliationSummary {
  totalA: number;
  totalB: number;
  exactMatches: number;
  amountVariances: number;
  uniqueA: number;
  uniqueB: number;
  matchRate: number;
  duplicatesA: number;
  duplicatesB: number;
  manualMatches: number;
}

export interface MatchedRow {
  key: string;
  rowA: string[];
  rowB: string[];
}

export interface VarianceRow {
  key: string;
  rowA: string[];
  rowB: string[];
  amountA: number;
  amountB: number;
  variance: number;
}

export interface UniqueRow {
  key: string;
  row: string[];
}

export interface ManualMatch {
  indexA: number;
  indexB: number;
  keyA: string;
  keyB: string;
  rowA: string[];
  rowB: string[];
  similarity: number;
}

export interface ReconciliationResult {
  summary: ReconciliationSummary;
  matches: MatchedRow[];
  amountVariances: VarianceRow[];
  uniqueA: UniqueRow[];
  uniqueB: UniqueRow[];
}

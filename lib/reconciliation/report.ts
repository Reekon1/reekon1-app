import ExcelJS from "exceljs";
import type {
  ParsedFile,
  ReconciliationResult,
  ManualMatch,
} from "./types";

function formatDate(): string {
  const now = new Date();
  const d = now.toISOString().slice(0, 10);
  const t = now.toTimeString().slice(0, 5).replace(":", "h");
  return `${d}-${t}`;
}

function sanitizeCell(value: unknown): string | number {
  if (typeof value === "number") return value;
  const str = String(value ?? "");
  // Strip XML-invalid control characters (keep tab, newline, CR)
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
}

function padRow(row: (string | number)[], targetLength: number): (string | number)[] {
  if (row.length >= targetLength) return row;
  return [...row, ...Array(targetLength - row.length).fill("")];
}

export async function generateReport(
  result: ReconciliationResult,
  fileA: ParsedFile,
  fileB: ParsedFile,
  manualMatches?: ManualMatch[]
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const s = result.summary;

  // Recalculate match rate including manual matches
  const manualCount = manualMatches?.length ?? 0;
  const totalMatched = s.exactMatches + s.amountVariances + manualCount;
  const adjustedMatchRate =
    s.totalA + s.totalB > 0
      ? Math.round((totalMatched * 2) / (s.totalA + s.totalB) * 10000) / 100
      : 0;

  // --- Sheet 1: Synthèse ---
  const synthese = workbook.addWorksheet("Synthèse");

  synthese.columns = [
    { header: "Métrique", key: "metric", width: 35 },
    { header: "Valeur", key: "value", width: 20 },
  ];

  const summaryRows: { metric: string; value: string | number }[] = [
    { metric: "Fichier Système A", value: fileA.fileName },
    { metric: "Fichier Système B", value: fileB.fileName },
    { metric: "Lignes Système A", value: s.totalA },
    { metric: "Lignes Système B", value: s.totalB },
    { metric: "", value: "" },
    { metric: "Taux de correspondance", value: `${adjustedMatchRate}%` },
    { metric: "Correspondances exactes", value: s.exactMatches },
    { metric: "Écarts de montant", value: s.amountVariances },
  ];

  if (manualCount > 0) {
    summaryRows.push({ metric: "Correspondances manuelles", value: manualCount });
  }

  summaryRows.push(
    { metric: "Lignes uniques Système A", value: s.uniqueA - manualCount },
    { metric: "Lignes uniques Système B", value: s.uniqueB - manualCount },
  );

  if (s.duplicatesA + s.duplicatesB > 0) {
    summaryRows.push({ metric: "", value: "" });
    summaryRows.push({ metric: "Doublons supprimés Système A", value: s.duplicatesA });
    summaryRows.push({ metric: "Doublons supprimés Système B", value: s.duplicatesB });
  }

  summaryRows.forEach((row) => synthese.addRow(row));

  synthese.getRow(1).font = { bold: true };
  synthese.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };

  // --- Sheet 2: Écarts Système A ---
  const sheetA = workbook.addWorksheet("Écarts Système A");
  const headersA = ["Statut", "Clé", ...fileA.headers, "Variance"];
  const maxColsA = headersA.length;
  sheetA.addRow(headersA.map(sanitizeCell));
  sheetA.getRow(1).font = { bold: true };
  sheetA.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };

  // Manual matches in A sheet
  if (manualMatches) {
    for (const m of manualMatches) {
      const rowData = padRow(
        ["Manuel", sanitizeCell(m.keyA), ...m.rowA.map(sanitizeCell), ""],
        maxColsA
      );
      const row = sheetA.addRow(rowData);
      row.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD1FAE5" }, // green-100
      };
    }
  }

  // Amount variances from A's perspective
  for (const v of result.amountVariances) {
    const rowData = padRow(
      ["Écart de montant", sanitizeCell(v.key), ...v.rowA.map(sanitizeCell), v.variance],
      maxColsA
    );
    const row = sheetA.addRow(rowData);
    row.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFF3CD" },
    };
  }

  // Unique A rows (excluding manually matched by index)
  const manualIndexSetA = new Set(manualMatches?.map((m) => m.indexA) ?? []);
  for (let ui = 0; ui < result.uniqueA.length; ui++) {
    if (manualIndexSetA.has(ui)) continue;
    const u = result.uniqueA[ui];
    const rowData = padRow(
      ["Absent de B", sanitizeCell(u.key), ...u.row.map(sanitizeCell), ""],
      maxColsA
    );
    const row = sheetA.addRow(rowData);
    row.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF8D7DA" },
    };
  }

  sheetA.columns.forEach((col) => {
    col.width = Math.max(12, (col.header?.toString().length ?? 0) + 4);
  });

  // --- Sheet 3: Écarts Système B ---
  const sheetB = workbook.addWorksheet("Écarts Système B");
  const headersB = ["Statut", "Clé", ...fileB.headers, "Variance"];
  const maxColsB = headersB.length;
  sheetB.addRow(headersB.map(sanitizeCell));
  sheetB.getRow(1).font = { bold: true };
  sheetB.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };

  // Manual matches in B sheet
  if (manualMatches) {
    for (const m of manualMatches) {
      const rowData = padRow(
        ["Manuel", sanitizeCell(m.keyB), ...m.rowB.map(sanitizeCell), ""],
        maxColsB
      );
      const row = sheetB.addRow(rowData);
      row.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD1FAE5" },
      };
    }
  }

  // Amount variances from B's perspective
  for (const v of result.amountVariances) {
    const rowData = padRow(
      ["Écart de montant", sanitizeCell(v.key), ...v.rowB.map(sanitizeCell), -v.variance],
      maxColsB
    );
    const row = sheetB.addRow(rowData);
    row.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFF3CD" },
    };
  }

  // Unique B rows (excluding manually matched by index)
  const manualIndexSetB = new Set(manualMatches?.map((m) => m.indexB) ?? []);
  for (let ui = 0; ui < result.uniqueB.length; ui++) {
    if (manualIndexSetB.has(ui)) continue;
    const u = result.uniqueB[ui];
    const rowData = padRow(
      ["Absent de A", sanitizeCell(u.key), ...u.row.map(sanitizeCell), ""],
      maxColsB
    );
    const row = sheetB.addRow(rowData);
    row.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF8D7DA" },
    };
  }

  sheetB.columns.forEach((col) => {
    col.width = Math.max(12, (col.header?.toString().length ?? 0) + 4);
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function downloadBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rapprochement-${formatDate()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

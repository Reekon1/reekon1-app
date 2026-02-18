import ExcelJS from "exceljs";
import type {
  ParsedFile,
  ReconciliationResult,
} from "./types";

function formatDate(): string {
  const now = new Date();
  const d = now.toISOString().slice(0, 10);
  const t = now.toTimeString().slice(0, 5).replace(":", "h");
  return `${d}-${t}`;
}

export async function generateReport(
  result: ReconciliationResult,
  fileA: ParsedFile,
  fileB: ParsedFile
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const s = result.summary;

  // --- Sheet 1: Synthèse ---
  const synthese = workbook.addWorksheet("Synthèse");

  synthese.columns = [
    { header: "Métrique", key: "metric", width: 35 },
    { header: "Valeur", key: "value", width: 20 },
  ];

  const summaryRows = [
    { metric: "Fichier Système A", value: fileA.fileName },
    { metric: "Fichier Système B", value: fileB.fileName },
    { metric: "Lignes Système A", value: s.totalA },
    { metric: "Lignes Système B", value: s.totalB },
    { metric: "", value: "" },
    { metric: "Taux de correspondance", value: `${s.matchRate}%` },
    { metric: "Correspondances exactes", value: s.exactMatches },
    { metric: "Écarts de montant", value: s.amountVariances },
    { metric: "Lignes uniques Système A", value: s.uniqueA },
    { metric: "Lignes uniques Système B", value: s.uniqueB },
  ];

  if (s.duplicatesA + s.duplicatesB > 0) {
    summaryRows.push({ metric: "", value: "" });
    summaryRows.push({ metric: "Doublons supprimés Système A", value: s.duplicatesA });
    summaryRows.push({ metric: "Doublons supprimés Système B", value: s.duplicatesB });
  }

  summaryRows.forEach((row) => synthese.addRow(row));

  // Style header
  synthese.getRow(1).font = { bold: true };
  synthese.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };

  // --- Sheet 2: Écarts Système A ---
  const sheetA = workbook.addWorksheet("Écarts Système A");
  const headersA = ["Statut", "Clé", ...fileA.headers, "Variance"];
  sheetA.addRow(headersA);
  sheetA.getRow(1).font = { bold: true };
  sheetA.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };

  // Amount variances from A's perspective
  for (const v of result.amountVariances) {
    const row = sheetA.addRow([
      "Écart de montant",
      v.key,
      ...v.rowA,
      v.variance,
    ]);
    row.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFF3CD" },
    };
  }

  // Unique A rows
  for (const u of result.uniqueA) {
    const row = sheetA.addRow(["Absent de B", u.key, ...u.row, ""]);
    row.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF8D7DA" },
    };
  }

  // Auto-width
  sheetA.columns.forEach((col) => {
    col.width = Math.max(12, (col.header?.toString().length ?? 0) + 4);
  });

  // --- Sheet 3: Écarts Système B ---
  const sheetB = workbook.addWorksheet("Écarts Système B");
  const headersB = ["Statut", "Clé", ...fileB.headers, "Variance"];
  sheetB.addRow(headersB);
  sheetB.getRow(1).font = { bold: true };
  sheetB.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };

  // Amount variances from B's perspective
  for (const v of result.amountVariances) {
    const row = sheetB.addRow([
      "Écart de montant",
      v.key,
      ...v.rowB,
      -v.variance,
    ]);
    row.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFF3CD" },
    };
  }

  // Unique B rows
  for (const u of result.uniqueB) {
    const row = sheetB.addRow(["Absent de A", u.key, ...u.row, ""]);
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

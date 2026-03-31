import * as XLSX from "xlsx";
import Papa from "papaparse";
import type { RawParsedFile, ParseWarning } from "./types";

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv", ".txt"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function getExtension(fileName: string): string {
  return fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
}

function detectEncoding(buffer: ArrayBuffer): string {
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    decoder.decode(buffer);
    return "utf-8";
  } catch {
    // Try Windows-1252 heuristic: check for bytes in 0x80-0x9F range
    // which exist in Windows-1252 but not in ISO-8859-1
    const bytes = new Uint8Array(buffer);
    let hasWin1252Chars = false;
    for (let i = 0; i < Math.min(bytes.length, 10000); i++) {
      if (bytes[i] >= 0x80 && bytes[i] <= 0x9f) {
        hasWin1252Chars = true;
        break;
      }
    }
    return hasWin1252Chars ? "windows-1252" : "iso-8859-1";
  }
}

export function validateFile(file: File): string | null {
  const ext = getExtension(file.name);
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return "Format non supporté. Formats acceptés : xlsx, xls, csv, txt";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Fichier trop volumineux. Taille maximale : 50 Mo";
  }
  return null;
}

export async function parseFile(file: File, sheetName?: string): Promise<RawParsedFile> {
  const ext = getExtension(file.name);
  const buffer = await file.arrayBuffer();

  const warnings: ParseWarning[] = [];

  // Large file warning
  if (file.size > 30 * 1024 * 1024) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    warnings.push({
      message: `Fichier volumineux (${sizeMb} Mo). Le traitement peut prendre quelques secondes.`,
      errorCount: 0,
      expectedRows: 0,
      actualRows: 0,
    });
  }

  if (ext === ".xlsx" || ext === ".xls") {
    const result = parseExcel(file.name, buffer, sheetName);
    if (warnings.length > 0) {
      result.warnings = [...(result.warnings ?? []), ...warnings];
    }
    return result;
  }

  const result = parseCsv(file.name, buffer);
  if (warnings.length > 0) {
    result.warnings = [...(result.warnings ?? []), ...warnings];
  }
  return result;
}

function parseExcel(fileName: string, buffer: ArrayBuffer, sheetName?: string): RawParsedFile {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetNames = workbook.SheetNames;
  const warnings: ParseWarning[] = [];

  let targetSheet = sheetNames[0];
  if (sheetName) {
    if (sheetNames.includes(sheetName)) {
      targetSheet = sheetName;
    } else {
      warnings.push({
        message: `Onglet "${sheetName}" non trouvé. Utilisation de "${sheetNames[0]}" par défaut.`,
        errorCount: 0,
        expectedRows: 0,
        actualRows: 0,
      });
    }
  }

  const sheet = workbook.Sheets[targetSheet];
  const data: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (data.length === 0) {
    throw new Error("Le fichier est vide");
  }

  const rawRows = data.map((row) => row.map(String));
  const totalColumns = Math.max(...rawRows.map((r) => r.length));

  return {
    fileName,
    rawRows,
    totalColumns,
    sheetNames: sheetNames.length > 1 ? sheetNames : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

function parseCsv(fileName: string, buffer: ArrayBuffer): RawParsedFile {
  const encoding = detectEncoding(buffer);
  const decoder = new TextDecoder(encoding);
  let text = decoder.decode(buffer);

  // Normalize line endings
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const result = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: true,
    delimiter: "", // auto-detect
  });

  const warnings: ParseWarning[] = [];
  let data = result.data;

  // Recovery re-parse if high error rate
  if (result.errors.length > 0) {
    const totalEstimated = data.length + result.errors.length;
    const errorRate = result.errors.length / totalEstimated;

    if (errorRate > 0.01) {
      // Re-parse without quote handling
      const recovery = Papa.parse<string[]>(text, {
        header: false,
        skipEmptyLines: true,
        delimiter: "", // auto-detect
        quoteChar: "\0",
      });

      if (recovery.data.length > data.length) {
        const originalCols = data.length > 0 ? Math.max(...data.map((r) => r.length)) : 0;
        const recoveryCols = recovery.data.length > 0 ? Math.max(...recovery.data.map((r) => r.length)) : 0;

        data = recovery.data;

        const pct = Math.round((data.length / totalEstimated) * 100);
        warnings.push({
          message: `Votre fichier contient des guillemets non standard. ${data.length.toLocaleString("fr-FR")} lignes sur ${totalEstimated.toLocaleString("fr-FR")} ont été importées avec succès (${pct}%).`,
          errorCount: result.errors.length,
          expectedRows: totalEstimated,
          actualRows: data.length,
        });

        if (recoveryCols !== originalCols && originalCols > 0) {
          warnings.push({
            message: `Attention : le nombre de colonnes a changé après la récupération (${originalCols} → ${recoveryCols}). Vérifiez que les colonnes sont correctement alignées.`,
            errorCount: 0,
            expectedRows: 0,
            actualRows: 0,
          });
        }
      } else {
        warnings.push({
          message: `Attention : ${result.errors.length} erreurs de format détectées. ${data.length.toLocaleString("fr-FR")} lignes importées. Vérifiez le format de votre fichier.`,
          errorCount: result.errors.length,
          expectedRows: totalEstimated,
          actualRows: data.length,
        });
      }
    } else {
      warnings.push({
        message: `${result.errors.length} erreur(s) de format détectée(s). ${data.length.toLocaleString("fr-FR")} lignes importées.`,
        errorCount: result.errors.length,
        expectedRows: data.length + result.errors.length,
        actualRows: data.length,
      });
    }
  }

  if (result.errors.length > 0 && data.length === 0) {
    throw new Error("Impossible de lire le fichier. Vérifiez le format.");
  }

  if (data.length === 0) {
    throw new Error("Le fichier est vide");
  }

  const rawRows = data.map((row) => row.map(String));
  const totalColumns = Math.max(...rawRows.map((r) => r.length));

  return {
    fileName,
    rawRows,
    totalColumns,
    warnings: warnings.length > 0 ? warnings : undefined,
    detectedEncoding: encoding,
  };
}

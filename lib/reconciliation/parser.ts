import * as XLSX from "xlsx";
import Papa from "papaparse";
import type { RawParsedFile } from "./types";

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv", ".txt"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function getExtension(fileName: string): string {
  return fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
}

function detectEncoding(buffer: ArrayBuffer): string {
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    decoder.decode(buffer);
    return "utf-8";
  } catch {
    return "iso-8859-1";
  }
}

export function validateFile(file: File): string | null {
  const ext = getExtension(file.name);
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return "Format non supporté. Formats acceptés : xlsx, xls, csv, txt";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Fichier trop volumineux. Taille maximale : 10 Mo";
  }
  return null;
}

export async function parseFile(file: File): Promise<RawParsedFile> {
  const ext = getExtension(file.name);
  const buffer = await file.arrayBuffer();

  if (ext === ".xlsx" || ext === ".xls") {
    return parseExcel(file.name, buffer);
  }
  return parseCsv(file.name, buffer);
}

function parseExcel(fileName: string, buffer: ArrayBuffer): RawParsedFile {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const data: string[][] = XLSX.utils.sheet_to_json(firstSheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (data.length === 0) {
    throw new Error("Le fichier est vide");
  }

  const rawRows = data.map((row) => row.map(String));
  const totalColumns = Math.max(...rawRows.map((r) => r.length));

  return { fileName, rawRows, totalColumns };
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

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error("Impossible de lire le fichier. Vérifiez le format.");
  }

  const data = result.data;
  if (data.length === 0) {
    throw new Error("Le fichier est vide");
  }

  const rawRows = data.map((row) => row.map(String));
  const totalColumns = Math.max(...rawRows.map((r) => r.length));

  return { fileName, rawRows, totalColumns };
}

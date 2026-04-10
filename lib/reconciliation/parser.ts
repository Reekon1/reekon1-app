import * as XLSX from "xlsx";
import Papa from "papaparse";
import type { RawParsedFile, ParseWarning, RowIssue, ExcerptSegment, FieldIssue, IssueDiagnosis } from "./types";

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv", ".txt"];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

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
    return "Fichier trop volumineux. Taille maximale : 100 Mo";
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

  // Strip BOM (UTF-8 BOM decoded as U+FEFF)
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  // Normalize line endings
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const totalLines = text.split("\n").filter((l) => l.trim().length > 0).length;

  const result = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: true,
    delimiter: "", // auto-detect
  });

  const warnings: ParseWarning[] = [];
  let data = result.data;

  // Recovery re-parse if high error rate
  if (result.errors.length > 0) {
    const sourceLines = text.split("\n");

    const errorDiagnosis: Record<string, IssueDiagnosis> = {
      InvalidQuotes: {
        label: "Guillemet dans les données",
        explanation:
          'Un caractère " (guillemet double) apparaît dans un champ sans être échappé. Le logiciel de lecture interprète ce guillemet comme un délimiteur de texte CSV, ce qui décale ou fusionne les colonnes suivantes.',
        fix: 'Dans le fichier source, supprimez les guillemets doubles ou remplacez-les par des apostrophes (\'), ou encadrez le champ entier entre guillemets avec les guillemets internes doublés (""). Exemple : "LE GECKO" → \'LE GECKO\' ou ""LE GECKO"".',
      },
      MissingQuotes: {
        label: "Guillemet non fermé",
        explanation:
          'Un guillemet ouvrant " n\'a pas de guillemet fermant correspondant. Toutes les lignes suivantes sont absorbées dans le même champ jusqu\'à ce qu\'un autre guillemet soit trouvé, ce qui fusionne potentiellement des centaines de lignes.',
        fix: "Supprimez le guillemet orphelin ou ajoutez le guillemet fermant manquant dans le fichier source.",
      },
      UndetectableDelimiter: {
        label: "Séparateur non détecté",
        explanation:
          "Impossible de déterminer automatiquement le séparateur de colonnes (point-virgule, virgule, tabulation…).",
        fix: "Vérifiez que le fichier est bien un CSV valide avec un séparateur cohérent sur toutes les lignes.",
      },
      TooFewFields: {
        label: "Colonnes manquantes",
        explanation:
          "Cette ligne contient moins de colonnes que l'en-tête. Des données sont probablement manquantes ou un séparateur a été supprimé.",
        fix: "Vérifiez la ligne dans le fichier source et ajoutez les séparateurs ou valeurs manquants.",
      },
      TooManyFields: {
        label: "Colonnes en trop",
        explanation:
          "Cette ligne contient plus de colonnes que l'en-tête. Un champ contient probablement un séparateur (;) qui n'est pas échappé, ce qui crée des colonnes supplémentaires.",
        fix: "Dans le fichier source, encadrez entre guillemets les champs contenant un séparateur, ou supprimez le séparateur parasite du champ.",
      },
    };

    const highlightChars = (str: string, chars: Set<string>): ExcerptSegment[] => {
      if (chars.size === 0) return [{ text: str }];
      const segments: ExcerptSegment[] = [];
      let buf = "";
      for (const ch of str) {
        if (chars.has(ch)) {
          if (buf) segments.push({ text: buf });
          segments.push({ text: ch, highlight: true });
          buf = "";
        } else {
          buf += ch;
        }
      }
      if (buf) segments.push({ text: buf });
      return segments;
    };

    const QUOTE_CODES = new Set(["InvalidQuotes", "MissingQuotes"]);
    const COL_CODES = new Set(["TooFewFields", "TooManyFields"]);

    const buildRowIssues = (): RowIssue[] => {
      const byRow = new Map<number, Papa.ParseError[]>();
      for (const err of result.errors) {
        if (err.row == null) continue;
        const list = byRow.get(err.row) ?? [];
        list.push(err);
        byRow.set(err.row, list);
      }

      const expectedCols = data.length > 0 ? data[0].length : 0;
      const delimiter = result.meta.delimiter;
      const headers = (sourceLines[0] ?? "").trim().split(delimiter);
      const issues: RowIssue[] = [];

      for (const [row, errs] of byRow) {
        const line = row + 1; // 0-based → 1-based
        const codes = new Set(errs.map((e) => e.code));
        const diagnoses: IssueDiagnosis[] = [...codes].map(
          (code) => errorDiagnosis[code] ?? { label: code, explanation: "", fix: "" },
        );
        const sourceLine = sourceLines[row] ?? "";
        const truncated = sourceLine.length > 120 ? sourceLine.slice(0, 120) + "…" : sourceLine;
        const trimmed = truncated.trim();
        const rawFields = sourceLine.trim().split(delimiter);
        const actualCols = rawFields.length;

        // Determine which characters to highlight based on error type
        const badChars = new Set<string>();
        const hasQuoteError = [...codes].some((c) => QUOTE_CODES.has(c));
        const hasColError = [...codes].some((c) => COL_CODES.has(c));
        if (hasQuoteError) badChars.add('"');

        // Build structured fields
        const fields: FieldIssue[] = rawFields.map((val, idx) => {
          const isExtra = idx >= headers.length;
          return {
            header: isExtra
              ? `Colonne supplémentaire #${idx - headers.length + 1}`
              : headers[idx],
            value: highlightChars(val, badChars),
            isExtra: isExtra || undefined,
          };
        });

        issues.push({
          line,
          diagnoses,
          columnCount: actualCols !== expectedCols ? actualCols : undefined,
          expectedColumns: actualCols !== expectedCols ? expectedCols : undefined,
          excerpt: highlightChars(trimmed, badChars),
          fields,
        });
      }

      return issues.sort((a, b) => a.line - b.line);
    };

    const rowIssues = buildRowIssues();
    const errorRate = result.errors.length / (data.length + result.errors.length);

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

        warnings.push({
          message: `Votre fichier contient des guillemets non standard. ${data.length.toLocaleString("fr-FR")} lignes sur ${totalLines.toLocaleString("fr-FR")} ont été importées avec succès.`,
          errorCount: result.errors.length,
          expectedRows: totalLines,
          actualRows: data.length,
          rowIssues,
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
          message: `${result.errors.length} erreur(s) de format sur ${rowIssues.length} ligne(s). ${data.length.toLocaleString("fr-FR")} lignes importées sur ${totalLines.toLocaleString("fr-FR")}.`,
          errorCount: result.errors.length,
          expectedRows: totalLines,
          actualRows: data.length,
          rowIssues,
        });
      }
    } else {
      warnings.push({
        message: `${result.errors.length} erreur(s) de format sur ${rowIssues.length} ligne(s). ${data.length.toLocaleString("fr-FR")} lignes importées.`,
        errorCount: result.errors.length,
        expectedRows: totalLines,
        actualRows: data.length,
        rowIssues,
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

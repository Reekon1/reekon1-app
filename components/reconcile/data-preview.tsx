"use client";

import type { RawParsedFile } from "@/lib/reconciliation/types";

interface DataPreviewProps {
  raw: RawParsedFile;
  label: string;
  headerRowIndex: number;
  onHeaderRowChange: (index: number) => void;
}

const PREVIEW_DATA_ROWS = 8;

export function DataPreview({
  raw,
  label,
  headerRowIndex,
  onHeaderRowChange,
}: DataPreviewProps) {
  const headers =
    headerRowIndex < raw.rawRows.length
      ? raw.rawRows[headerRowIndex].map(String)
      : [];
  const dataRows = raw.rawRows.slice(headerRowIndex + 1);
  const totalRows = dataRows.length;
  const maxCols = raw.totalColumns;

  // Show: skipped rows + header row + first N data rows
  const previewDataRows = dataRows.slice(0, PREVIEW_DATA_ROWS);
  const visibleRowCount = headerRowIndex + 1 + previewDataRows.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium">{label}</h3>
        <span className="text-xs text-muted-foreground">
          {totalRows} lignes × {headers.length} colonnes
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Cliquez sur la ligne qui contient les en-têtes de colonnes
      </p>

      <div className="border rounded-md overflow-auto max-h-96">
        <table className="w-full text-sm">
          <tbody>
            {raw.rawRows.slice(0, visibleRowCount).map((row, rowIndex) => {
              const isHeader = rowIndex === headerRowIndex;
              const isSkipped = rowIndex < headerRowIndex;

              return (
                <tr
                  key={rowIndex}
                  onClick={() => onHeaderRowChange(rowIndex)}
                  className={[
                    "border-b last:border-0 cursor-pointer transition-colors",
                    isHeader
                      ? "bg-blue-50 hover:bg-blue-100"
                      : isSkipped
                        ? "bg-muted/30 opacity-50 hover:opacity-80 hover:bg-muted/50"
                        : "hover:bg-muted/30",
                  ].join(" ")}
                >
                  {/* Row number */}
                  <td className="px-2 py-1.5 text-xs text-muted-foreground text-right border-r w-8 select-none">
                    {rowIndex + 1}
                  </td>
                  {Array.from({ length: maxCols }, (_, colIndex) => (
                    <td
                      key={colIndex}
                      className={[
                        "px-3 py-1.5 whitespace-nowrap",
                        isHeader
                          ? "font-semibold text-blue-900"
                          : isSkipped
                            ? "text-muted-foreground italic text-xs"
                            : "text-muted-foreground",
                      ].join(" ")}
                    >
                      {row[colIndex] ?? ""}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalRows > PREVIEW_DATA_ROWS && (
        <p className="text-xs text-muted-foreground text-center">
          {totalRows - PREVIEW_DATA_ROWS} lignes supplémentaires non affichées
        </p>
      )}
    </div>
  );
}

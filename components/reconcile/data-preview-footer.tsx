"use client";

import type { RawParsedFile } from "@/lib/reconciliation/types";

interface DataPreviewFooterProps {
  raw: RawParsedFile;
  label: string;
  headerRowIndex: number;
  excludeFooter: number;
  onExcludeFooterChange: (count: number) => void;
}

const PREVIEW_TAIL_ROWS = 10;

export function DataPreviewFooter({
  raw,
  label,
  headerRowIndex,
  excludeFooter,
  onExcludeFooterChange,
}: DataPreviewFooterProps) {
  const dataRows = raw.rawRows.slice(headerRowIndex + 1);
  const totalDataRows = dataRows.length;
  const maxCols = raw.totalColumns;

  // Clamp excludeFooter defensively
  const clampedFooter = Math.min(excludeFooter, totalDataRows);
  // Last included data row index (when excludeFooter > 0)
  const lastIncludedIndex = totalDataRows - clampedFooter - 1;

  // Show last N rows (enough to see data + excluded rows)
  const visibleCount = Math.min(
    totalDataRows,
    PREVIEW_TAIL_ROWS + clampedFooter
  );
  const startIndex = totalDataRows - visibleCount; // index in dataRows
  const visibleRows = dataRows.slice(startIndex);
  const hiddenCount = startIndex;

  if (totalDataRows === 0) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{label}</h3>
        <p className="text-xs text-muted-foreground">
          Aucune ligne de données disponible
        </p>
      </div>
    );
  }

  function handleClick(dataRowIndex: number) {
    if (dataRowIndex === lastIncludedIndex && clampedFooter > 0) {
      // Toggle off — re-clicking the selected row resets to include all
      onExcludeFooterChange(0);
    } else {
      // Exclude everything after the clicked row
      const newExclude = totalDataRows - dataRowIndex - 1;
      onExcludeFooterChange(Math.max(0, newExclude));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium">{label}</h3>
        <span className="text-xs text-muted-foreground">
          {clampedFooter > 0
            ? `Dernière ligne incluse : ligne ${headerRowIndex + 1 + lastIncludedIndex + 1} (${clampedFooter} ligne(s) exclue(s))`
            : "Toutes les lignes incluses"}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Cliquez sur la <strong>dernière ligne</strong> à inclure dans le rapprochement
      </p>

      {hiddenCount > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {hiddenCount} lignes de données non affichées
        </p>
      )}

      <div className="border rounded-md overflow-auto max-h-96">
        <table className="w-full text-sm">
          <tbody>
            {visibleRows.map((row, i) => {
              const dataRowIndex = startIndex + i;
              const isLastIncluded =
                clampedFooter > 0 && dataRowIndex === lastIncludedIndex;
              const isExcluded = clampedFooter > 0 && dataRowIndex > lastIncludedIndex;

              // File row number (1-based): headerRowIndex + 1 (header) + dataRowIndex + 1
              const fileRowNumber = headerRowIndex + 1 + dataRowIndex + 1;

              return (
                <tr
                  key={dataRowIndex}
                  onClick={() => handleClick(dataRowIndex)}
                  className={[
                    "border-b last:border-0 cursor-pointer transition-colors",
                    isLastIncluded
                      ? "bg-blue-50 hover:bg-blue-100"
                      : isExcluded
                        ? "bg-muted/30 opacity-50 hover:opacity-80 hover:bg-muted/50"
                        : "hover:bg-muted/30",
                  ].join(" ")}
                >
                  <td className="px-2 py-1.5 text-xs text-muted-foreground text-right border-r w-8 select-none">
                    {fileRowNumber}
                  </td>
                  {Array.from({ length: maxCols }, (_, colIndex) => (
                    <td
                      key={colIndex}
                      className={[
                        "px-3 py-1.5 whitespace-nowrap",
                        isLastIncluded
                          ? "font-semibold text-blue-900"
                          : isExcluded
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
    </div>
  );
}

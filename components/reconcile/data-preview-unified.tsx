"use client";

import type { RawParsedFile } from "@/lib/reconciliation/types";

interface DataPreviewUnifiedProps {
  raw: RawParsedFile;
  label: string;
  headerRowIndex: number;
  onHeaderRowChange: (index: number) => void;
  excludeFooter: number;
  onExcludeFooterChange: (count: number) => void;
}

const PREVIEW_HEAD_ROWS = 8;
const PREVIEW_TAIL_ROWS = 8;

export function DataPreviewUnified({
  raw,
  label,
  headerRowIndex,
  onHeaderRowChange,
  excludeFooter,
  onExcludeFooterChange,
}: DataPreviewUnifiedProps) {
  const totalRaw = raw.rawRows.length;
  const maxCols = raw.totalColumns;
  const totalDataRows = totalRaw - headerRowIndex - 1;

  // Clamp footer defensively
  const clampedFooter = Math.min(excludeFooter, Math.max(0, totalDataRows));
  const lastIncludedRaw = totalRaw - clampedFooter - 1;

  // Compute which rows to show in top and bottom zones
  const topEnd = Math.min(totalRaw, headerRowIndex + 1 + PREVIEW_HEAD_ROWS);
  const bottomStart = Math.max(0, totalRaw - PREVIEW_TAIL_ROWS - clampedFooter);

  // If zones overlap or nearly meet, show everything
  const showAll = bottomStart <= topEnd;

  const topRows = showAll
    ? raw.rawRows
    : raw.rawRows.slice(0, topEnd);
  const bottomRows = showAll
    ? []
    : raw.rawRows.slice(bottomStart);
  const hiddenCount = showAll ? 0 : bottomStart - topEnd;

  function handleTopClick(rawIndex: number) {
    if (rawIndex >= lastIncludedRaw) return;
    onHeaderRowChange(rawIndex);
  }

  function handleBottomClick(rawIndex: number) {
    if (rawIndex <= headerRowIndex) return;
    if (rawIndex === lastIncludedRaw && clampedFooter > 0) {
      // Toggle off — re-clicking the last included row resets to include all
      onExcludeFooterChange(0);
    } else {
      const newExclude = totalRaw - rawIndex - 1;
      onExcludeFooterChange(Math.max(0, newExclude));
    }
  }

  function rowClassName(rawIndex: number): string {
    const isHeader = rawIndex === headerRowIndex;
    const isSkippedAbove = rawIndex < headerRowIndex;
    const isLastIncluded = clampedFooter > 0 && rawIndex === lastIncludedRaw;
    const isExcludedBelow = clampedFooter > 0 && rawIndex > lastIncludedRaw;

    const base = "border-b last:border-0 cursor-pointer transition-colors";

    if (isHeader) return `${base} bg-blue-50 hover:bg-blue-100`;
    if (isLastIncluded) return `${base} bg-emerald-50 hover:bg-emerald-100`;
    if (isSkippedAbove || isExcludedBelow)
      return `${base} bg-muted/30 opacity-50 hover:opacity-80 hover:bg-muted/50`;
    return `${base} hover:bg-muted/30`;
  }

  function cellClassName(rawIndex: number): string {
    const isHeader = rawIndex === headerRowIndex;
    const isSkippedAbove = rawIndex < headerRowIndex;
    const isLastIncluded = clampedFooter > 0 && rawIndex === lastIncludedRaw;
    const isExcludedBelow = clampedFooter > 0 && rawIndex > lastIncludedRaw;

    const base = "px-3 py-1.5 whitespace-nowrap";

    if (isHeader) return `${base} font-semibold text-blue-900`;
    if (isLastIncluded) return `${base} font-semibold text-emerald-900`;
    if (isSkippedAbove || isExcludedBelow)
      return `${base} text-muted-foreground italic text-xs`;
    return `${base} text-muted-foreground`;
  }

  function badgeForRow(rawIndex: number) {
    if (rawIndex === headerRowIndex) {
      return (
        <span className="ml-1 text-[10px] font-medium text-blue-700 bg-blue-100 rounded px-1">
          En-tête
        </span>
      );
    }
    if (clampedFooter > 0 && rawIndex === lastIncludedRaw) {
      return (
        <span className="ml-1 text-[10px] font-medium text-emerald-700 bg-emerald-100 rounded px-1">
          Fin
        </span>
      );
    }
    return null;
  }

  function renderRow(
    row: string[],
    rawIndex: number,
    onClick: (rawIndex: number) => void,
  ) {
    return (
      <tr
        key={rawIndex}
        onClick={() => onClick(rawIndex)}
        className={rowClassName(rawIndex)}
      >
        <td className="px-2 py-1.5 text-xs text-muted-foreground text-right border-r w-12 select-none whitespace-nowrap">
          {rawIndex + 1}
          {badgeForRow(rawIndex)}
        </td>
        {Array.from({ length: maxCols }, (_, colIndex) => (
          <td key={colIndex} className={cellClassName(rawIndex)}>
            {row[colIndex] ?? ""}
          </td>
        ))}
      </tr>
    );
  }

  // Summary text
  const summaryParts: string[] = [];
  summaryParts.push(`${totalDataRows} lignes de données`);
  if (clampedFooter > 0) {
    summaryParts.push(`${clampedFooter} exclue(s) en fin`);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium">{label}</h3>
        <span className="text-xs text-muted-foreground">
          {summaryParts.join(" · ")}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Cliquez sur la <strong>ligne d'en-tête</strong> (bleu) et sur la{" "}
        <strong>dernière ligne</strong> à inclure (vert)
      </p>

      <div className="border rounded-md overflow-auto max-h-[28rem]">
        <table className="w-full text-sm">
          <tbody>
            {/* Top zone */}
            {topRows.map((row, i) => {
              const rawIndex = i;
              const onClick = showAll && rawIndex > headerRowIndex
                ? handleBottomClick
                : handleTopClick;
              return renderRow(row, rawIndex, onClick);
            })}

            {/* Ellipsis separator */}
            {!showAll && hiddenCount > 0 && (
              <tr className="border-b border-dashed">
                <td
                  colSpan={maxCols + 1}
                  className="py-2 text-center text-xs text-muted-foreground"
                >
                  ··· {hiddenCount.toLocaleString("fr-FR")} lignes masquées ···
                </td>
              </tr>
            )}

            {/* Bottom zone */}
            {!showAll &&
              bottomRows.map((row, i) => {
                const rawIndex = bottomStart + i;
                return renderRow(row, rawIndex, handleBottomClick);
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

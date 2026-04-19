"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  computeSuggestionsAsync,
  type SimilaritySuggestion,
} from "@/lib/reconciliation/similarity";
import type { ManualMatch, UniqueRow } from "@/lib/reconciliation/types";

interface ManualReconciliationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headersA: string[];
  headersB: string[];
  fileAName?: string;
  fileBName?: string;
  // Unique rows remaining (already filtered of previous manual matches).
  remainingA: UniqueRow[];
  remainingB: UniqueRow[];
  // Maps filtered index -> original uniqueA/B index so we can persist matches
  // consistently across multiple passes.
  remainingOriginalIndexA: number[];
  remainingOriginalIndexB: number[];
  onConfirm: (newMatches: ManualMatch[]) => void;
}

function SimilarityBadge({ value }: { value: number }) {
  let color: string;
  if (value > 90) color = "bg-green-100 text-green-700";
  else if (value >= 60) color = "bg-orange-100 text-orange-700";
  else color = "bg-red-100 text-red-700";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      {value}%
    </span>
  );
}

function baseName(fileName?: string) {
  if (!fileName) return "";
  return fileName.replace(/\.[^/.]+$/, "");
}

export function ManualReconciliationModal({
  open,
  onOpenChange,
  headersA,
  headersB,
  fileAName,
  fileBName,
  remainingA,
  remainingB,
  remainingOriginalIndexA,
  remainingOriginalIndexB,
  onConfirm,
}: ManualReconciliationModalProps) {
  const [suggestions, setSuggestions] = useState<SimilaritySuggestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isComputing, setIsComputing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  // Bump each time we kick off a compute so a stale run cannot clobber the
  // latest results if the modal is rapidly reopened.
  const computeIdRef = useRef(0);

  const compute = useCallback(async () => {
    const myId = ++computeIdRef.current;
    setIsComputing(true);
    setProgress({ current: 0, total: remainingA.length });

    const sug = await computeSuggestionsAsync(
      remainingA,
      remainingB,
      (current, total) => {
        if (computeIdRef.current === myId) setProgress({ current, total });
      }
    );

    if (computeIdRef.current !== myId) return;

    // Pre-select greedy 1:1 on similarity > 90.
    const initialSelected = new Set<number>();
    const claimedA = new Set<number>();
    const claimedB = new Set<number>();
    sug.forEach((s, i) => {
      if (s.similarity > 90 && !claimedA.has(s.indexA) && !claimedB.has(s.indexB)) {
        initialSelected.add(i);
        claimedA.add(s.indexA);
        claimedB.add(s.indexB);
      }
    });

    setSuggestions(sug);
    setSelected(initialSelected);
    setIsComputing(false);
  }, [remainingA, remainingB]);

  useEffect(() => {
    if (!open) return;
    setSuggestions([]);
    setSelected(new Set());
    compute();
    // Intentional: only re-run on open transitions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { usedA, usedB } = useMemo(() => {
    const a = new Set<number>();
    const b = new Set<number>();
    for (const idx of selected) {
      const s = suggestions[idx];
      if (s) {
        a.add(s.indexA);
        b.add(s.indexB);
      }
    }
    return { usedA: a, usedB: b };
  }, [selected, suggestions]);

  const toggleSelection = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const isDisabled = (idx: number) => {
    if (selected.has(idx)) return false;
    const s = suggestions[idx];
    return usedA.has(s.indexA) || usedB.has(s.indexB);
  };

  const handleValidate = () => {
    const pairs = Array.from(selected)
      .map((i) => suggestions[i])
      .filter(Boolean);
    const matches: ManualMatch[] = pairs.map((s) => ({
      indexA: remainingOriginalIndexA[s.indexA],
      indexB: remainingOriginalIndexB[s.indexB],
      keyA: s.keyA,
      keyB: s.keyB,
      rowA: remainingA[s.indexA]?.row ?? [],
      rowB: remainingB[s.indexB]?.row ?? [],
      similarity: s.similarity,
    }));
    onConfirm(matches);
    onOpenChange(false);
  };

  const selectedCount = selected.size;
  const maxPairs = Math.min(remainingA.length, remainingB.length);

  const nameA = baseName(fileAName) || "Fichier A";
  const nameB = baseName(fileBName) || "Fichier B";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(96vw,1600px)] sm:max-w-[min(96vw,1600px)] max-h-[92vh] flex flex-col gap-4 overflow-hidden">
        <DialogHeader>
          <DialogTitle>Rapprochement manuel</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{remainingA.length}</span> ligne
            {remainingA.length !== 1 ? "s" : ""} A ·{" "}
            <span className="font-medium text-foreground">{remainingB.length}</span> ligne
            {remainingB.length !== 1 ? "s" : ""} B non rapprochées. Au plus{" "}
            <span className="font-medium text-foreground">{maxPairs}</span>{" "}
            paire{maxPairs !== 1 ? "s" : ""} possible{maxPairs !== 1 ? "s" : ""}. Similarité calculée sur l&apos;ensemble de la ligne.
          </DialogDescription>
        </DialogHeader>

        {isComputing && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md shrink-0">
            <p className="text-sm text-blue-700">
              Calcul des suggestions... {progress.current}/{progress.total}
            </p>
            <div className="mt-2 h-2 bg-blue-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{
                  width: `${(progress.current / Math.max(progress.total, 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {!isComputing && suggestions.length === 0 && (
          <div className="p-4 border rounded-md text-sm text-muted-foreground shrink-0">
            Aucune suggestion à afficher.
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="border rounded-md overflow-auto flex-1 min-h-0">
            <table className="text-xs border-collapse">
              <thead className="bg-muted/60 sticky top-0 z-10">
                <tr>
                  <th
                    rowSpan={2}
                    className="px-2 py-2 text-left font-medium border-b border-r bg-muted/60 sticky left-0 z-20 w-10"
                  ></th>
                  <th
                    rowSpan={2}
                    className="px-3 py-2 text-left font-medium border-b border-r bg-muted/60 whitespace-nowrap"
                  >
                    %
                  </th>
                  <th
                    colSpan={Math.max(headersA.length, 1)}
                    className="px-3 py-1 text-left font-semibold border-b border-l bg-blue-50 text-blue-900"
                  >
                    {nameA}
                  </th>
                  <th
                    colSpan={Math.max(headersB.length, 1)}
                    className="px-3 py-1 text-left font-semibold border-b border-l bg-violet-50 text-violet-900"
                  >
                    {nameB}
                  </th>
                </tr>
                <tr>
                  {(headersA.length > 0 ? headersA : [""]).map((h, i) => (
                    <th
                      key={`ha-${i}`}
                      className={`px-3 py-2 text-left font-medium border-b whitespace-nowrap bg-blue-50/70 text-blue-900 ${i === 0 ? "border-l" : ""}`}
                    >
                      {h || `Col ${i + 1}`}
                    </th>
                  ))}
                  {(headersB.length > 0 ? headersB : [""]).map((h, i) => (
                    <th
                      key={`hb-${i}`}
                      className={`px-3 py-2 text-left font-medium border-b whitespace-nowrap bg-violet-50/70 text-violet-900 ${i === 0 ? "border-l" : ""}`}
                    >
                      {h || `Col ${i + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {suggestions.map((s, idx) => {
                  const disabled = isDisabled(idx);
                  const checked = selected.has(idx);
                  const rowA = remainingA[s.indexA]?.row ?? [];
                  const rowB = remainingB[s.indexB]?.row ?? [];
                  const rowBg = checked
                    ? "bg-green-50/60"
                    : disabled
                      ? "bg-muted/20"
                      : "";
                  return (
                    <tr
                      key={idx}
                      className={`border-b last:border-0 ${disabled ? "opacity-50" : ""} ${rowBg}`}
                    >
                      <td
                        className={`px-2 py-1.5 border-r sticky left-0 z-10 ${rowBg || "bg-background"}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleSelection(idx)}
                          aria-disabled={disabled}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-3 py-1.5 border-r whitespace-nowrap">
                        <SimilarityBadge value={s.similarity} />
                      </td>
                      {(headersA.length > 0 ? headersA : [""]).map((_, ci) => (
                        <td
                          key={`ra-${ci}`}
                          className={`px-3 py-1.5 max-w-[220px] truncate ${ci === 0 ? "border-l bg-blue-50/20" : "bg-blue-50/20"}`}
                          title={rowA[ci] ?? ""}
                        >
                          {rowA[ci] ?? ""}
                        </td>
                      ))}
                      {(headersB.length > 0 ? headersB : [""]).map((_, ci) => (
                        <td
                          key={`rb-${ci}`}
                          className={`px-3 py-1.5 max-w-[220px] truncate ${ci === 0 ? "border-l bg-violet-50/20" : "bg-violet-50/20"}`}
                          title={rowB[ci] ?? ""}
                        >
                          {rowB[ci] ?? ""}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {suggestions.length > 0 && (
          <p className="text-sm text-muted-foreground shrink-0">
            {selectedCount} paire{selectedCount !== 1 ? "s" : ""} sélectionnée
            {selectedCount !== 1 ? "s" : ""} sur {suggestions.length} suggestion
            {suggestions.length !== 1 ? "s" : ""}
          </p>
        )}

        <DialogFooter className="shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleValidate} disabled={isComputing || selectedCount === 0}>
            Valider {selectedCount > 0 && `(${selectedCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

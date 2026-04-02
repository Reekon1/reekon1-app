"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UniqueRow } from "@/lib/reconciliation/types";
import type { SimilaritySuggestion } from "@/lib/reconciliation/similarity";

interface ManualReconciliationProps {
  suggestions: SimilaritySuggestion[];
  uniqueA: UniqueRow[];
  uniqueB: UniqueRow[];
  onConfirm: (selectedPairs: SimilaritySuggestion[]) => void;
  onSkip: () => void;
}

function SimilarityBadge({ value }: { value: number }) {
  if (value > 90) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Probable
      </span>
    );
  }
  if (value >= 60) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
        {value}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      {value}%
    </span>
  );
}

export function ManualReconciliation({
  suggestions,
  uniqueA,
  uniqueB,
  onConfirm,
  onSkip,
}: ManualReconciliationProps) {
  // Pre-check suggestions > 90%
  const [selected, setSelected] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    const claimedA = new Set<number>();
    const claimedB = new Set<number>();
    // Suggestions are sorted by similarity desc — greedy 1:1 assignment
    suggestions.forEach((s, i) => {
      if (s.similarity > 90 && !claimedA.has(s.indexA) && !claimedB.has(s.indexB)) {
        initial.add(i);
        claimedA.add(s.indexA);
        claimedB.add(s.indexB);
      }
    });
    return initial;
  });

  // Compute which indexA and indexB are already selected (1:1 constraint)
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
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const isDisabled = (idx: number) => {
    if (selected.has(idx)) return false;
    const s = suggestions[idx];
    return usedA.has(s.indexA) || usedB.has(s.indexB);
  };

  const handleConfirm = () => {
    const pairs = Array.from(selected)
      .map((i) => suggestions[i])
      .filter(Boolean);
    onConfirm(pairs);
  };

  const totalUnmatched = uniqueA.length + uniqueB.length;
  const selectedCount = selected.size;

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rapprochement manuel</CardTitle>
          <CardDescription>
            Aucune suggestion trouvée (similarité &lt; 40%). Toutes les lignes restantes sont uniques.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={onSkip}>
            Continuer sans rapprochement manuel
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Rapprochement manuel</CardTitle>
        <CardDescription>
          {totalUnmatched} lignes non rapprochées automatiquement.
          {" "}Sélectionnez les paires à rapprocher manuellement.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="border rounded-md overflow-x-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-medium border-b w-10"></th>
                <th className="px-3 py-2 text-left font-medium border-b whitespace-nowrap">Clé A</th>
                <th className="px-3 py-2 text-left font-medium border-b whitespace-nowrap">Clé B</th>
                <th className="px-3 py-2 text-left font-medium border-b whitespace-nowrap">Similarité</th>
                <th className="px-3 py-2 text-left font-medium border-b"></th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((s, idx) => {
                const disabled = isDisabled(idx);
                const checked = selected.has(idx);
                return (
                  <tr
                    key={idx}
                    className={`border-b last:border-0 ${disabled ? "opacity-50" : ""} ${checked ? "bg-green-50/50" : ""}`}
                  >
                    <td className="px-3 py-1.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleSelection(idx)}
                        aria-disabled={disabled}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap text-muted-foreground font-mono text-xs">
                      {s.keyA}
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap text-muted-foreground font-mono text-xs">
                      {s.keyB}
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      {s.similarity}%
                    </td>
                    <td className="px-3 py-1.5">
                      <SimilarityBadge value={s.similarity} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-muted-foreground">
          {selectedCount} paire{selectedCount !== 1 ? "s" : ""} sélectionnée{selectedCount !== 1 ? "s" : ""} sur {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""}
        </p>

        <div className="flex gap-3">
          <Button onClick={handleConfirm}>
            Valider la sélection
          </Button>
          <Button variant="ghost" onClick={onSkip}>
            Passer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

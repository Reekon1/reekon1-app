"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ParsedFile, KeyTransform, KeyMapping } from "@/lib/reconciliation/types";
import { applyTransform } from "@/lib/reconciliation/normalizer";

export interface ConfigurationConfig {
  keyMappings: KeyMapping[];
  amountColumnA: number | null;
  amountColumnB: number | null;
}

interface ConfigurationStepProps {
  fileA: ParsedFile;
  fileB: ParsedFile;
  onSubmit: (config: ConfigurationConfig) => void;
  onBack: () => void;
  isLoading: boolean;
  deduplication: boolean;
  onDeduplicationChange: (value: boolean) => void;
  initialConfig?: {
    keyMappings: KeyMapping[];
    amountColumnA: number | null;
    amountColumnB: number | null;
  };
  warnings?: string[];
}

interface KeyGroup {
  colsA: number[];
  colsB: number[];
  separator: string;
  transform: KeyTransform;
}

type ActiveSelection =
  | { type: "key"; groupIndex: number; side: "A" | "B" }
  | { type: "amount"; side: "A" | "B" }
  | null;

const PAIR_COLORS = [
  {
    bg: "bg-blue-100",
    text: "text-blue-800",
    cellBg: "bg-blue-50",
    badge: "bg-blue-600 text-white",
    ring: "ring-blue-500",
    activeBorder: "border-blue-500",
  },
  {
    bg: "bg-violet-100",
    text: "text-violet-800",
    cellBg: "bg-violet-50",
    badge: "bg-violet-600 text-white",
    ring: "ring-violet-500",
    activeBorder: "border-violet-500",
  },
  {
    bg: "bg-amber-100",
    text: "text-amber-800",
    cellBg: "bg-amber-50",
    badge: "bg-amber-600 text-white",
    ring: "ring-amber-500",
    activeBorder: "border-amber-500",
  },
  {
    bg: "bg-teal-100",
    text: "text-teal-800",
    cellBg: "bg-teal-50",
    badge: "bg-teal-600 text-white",
    ring: "ring-teal-500",
    activeBorder: "border-teal-500",
  },
] as const;

const AMOUNT_COLOR = {
  bg: "bg-green-100",
  text: "text-green-800",
  cellBg: "bg-green-50",
  badge: "bg-green-600 text-white",
  ring: "ring-green-500",
  activeBorder: "border-green-500",
};

function TransformSelect({
  value,
  onChange,
  id,
}: {
  value: KeyTransform;
  onChange: (v: KeyTransform) => void;
  id: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as KeyTransform)}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <option value="default">Normalisation standard</option>
      <option value="alphanumeric_only">Alphanum\u00e9rique uniquement (ex: N\u00b03456 \u2192 n3456)</option>
      <option value="extract_code_prefix">Extraire le code (ex: CNFFOKTOS \u2013 OKTOS \u2192 cnffoktos)</option>
      <option value="absolute_amount">Valeur absolue (ex: -1 234,56 \u2192 1234.56)</option>
    </select>
  );
}

function baseName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "");
}

const MAX_PREVIEW_ROWS = 5;

type ColColor = (typeof PAIR_COLORS)[number] | typeof AMOUNT_COLOR;

function SpreadsheetPreview({
  file,
  side,
  keyGroups,
  amountCol,
  activeSelection,
  onColumnClick,
  collapsed,
}: {
  file: ParsedFile;
  side: "A" | "B";
  keyGroups: KeyGroup[];
  amountCol: number | null;
  activeSelection: ActiveSelection;
  onColumnClick: (colIdx: number) => void;
  collapsed: boolean;
}) {
  const isTargetSide = activeSelection?.side === side;
  const previewRows = file.rows.slice(0, MAX_PREVIEW_ROWS);

  const getColInfo = (colIdx: number): { color: ColColor; label: string } | null => {
    for (let gi = 0; gi < keyGroups.length; gi++) {
      const cols = side === "A" ? keyGroups[gi].colsA : keyGroups[gi].colsB;
      if (cols.includes(colIdx)) {
        return {
          color: PAIR_COLORS[gi % PAIR_COLORS.length],
          label: `Cl\u00e9 ${gi + 1}`,
        };
      }
    }
    if (amountCol === colIdx) {
      return { color: AMOUNT_COLOR, label: "Montant" };
    }
    return null;
  };

  return (
    <div
      className={cn(
        "rounded-md border overflow-hidden transition-all duration-200",
        isTargetSide && "ring-2 ring-primary shadow-md"
      )}
    >
      <div className={cn("overflow-x-auto", collapsed ? "max-h-12" : "max-h-56")} style={{ transition: "max-height 200ms ease" }}>
        <table className="text-xs border-collapse w-full min-w-max">
          <thead className="sticky top-0 z-10">
            <tr className="bg-background border-b">
              {file.headers.map((header, colIdx) => {
                const info = getColInfo(colIdx);
                return (
                  <th
                    key={colIdx}
                    onClick={isTargetSide ? () => onColumnClick(colIdx) : undefined}
                    className={cn(
                      "px-2.5 py-2 text-left font-medium whitespace-nowrap border-r last:border-r-0 select-none transition-colors",
                      isTargetSide
                        ? "cursor-pointer hover:bg-primary/10"
                        : "cursor-default",
                      info
                        ? `${info.color.bg} ${info.color.text}`
                        : "text-muted-foreground bg-muted/20"
                    )}
                  >
                    <div className="flex flex-col gap-0.5 min-w-[60px]">
                      {info && (
                        <span
                          className={cn(
                            "text-[9px] px-1 rounded font-semibold inline-block w-fit leading-4",
                            info.color.badge
                          )}
                        >
                          {info.label}
                        </span>
                      )}
                      <span>{header || `Col ${colIdx + 1}`}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          {!collapsed && (
            <tbody>
              {previewRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-b last:border-b-0 hover:bg-muted/10">
                  {file.headers.map((_, colIdx) => {
                    const info = getColInfo(colIdx);
                    return (
                      <td
                        key={colIdx}
                        className={cn(
                          "px-2.5 py-1 border-r last:border-r-0 max-w-[120px] truncate",
                          info ? info.color.cellBg : ""
                        )}
                      >
                        {row[colIdx] ?? ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {file.rows.length > MAX_PREVIEW_ROWS && (
                <tr>
                  <td
                    colSpan={file.headers.length}
                    className="px-2.5 py-1 text-center text-muted-foreground text-[10px] italic"
                  >
                    \u2026 {file.rows.length - MAX_PREVIEW_ROWS} lignes suppl\u00e9mentaires
                  </td>
                </tr>
              )}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}

function KeyPreview({
  fileA,
  fileB,
  group,
  color,
}: {
  fileA: ParsedFile;
  fileB: ParsedFile;
  group: KeyGroup;
  color: (typeof PAIR_COLORS)[number];
}) {
  if (group.colsA.length === 0 && group.colsB.length === 0) return null;
  const row0A = fileA.rows[0];
  const row0B = fileB.rows[0];
  if (!row0A && !row0B) return null;

  const buildPreview = (cols: number[], row: string[] | undefined, sep: string) => {
    if (!row || cols.length === 0) return null;
    return cols
      .map((c) => applyTransform(row[c] ?? "", group.transform))
      .join(sep);
  };

  const previewA = buildPreview(group.colsA, row0A, group.separator);
  const previewB = buildPreview(group.colsB, row0B, group.separator);
  const match = previewA !== null && previewB !== null && previewA === previewB;

  return (
    <div className={cn("text-xs px-3 py-1.5 rounded", color.bg, color.text)}>
      <span className="opacity-70">Aper\u00e7u : </span>
      {previewA !== null && (
        <span className="font-mono font-medium">&ldquo;{previewA}&rdquo;</span>
      )}
      {previewA !== null && previewB !== null && (
        <span className="mx-1.5">\u2194</span>
      )}
      {previewB !== null && (
        <span className="font-mono font-medium">&ldquo;{previewB}&rdquo;</span>
      )}
      {match && <span className="ml-1.5 text-green-700">\u2713</span>}
      {previewA !== null && previewB !== null && !match && (
        <span className="ml-1.5 text-red-600">\u2717</span>
      )}
    </div>
  );
}

export function ConfigurationStep({
  fileA,
  fileB,
  onSubmit,
  onBack,
  isLoading,
  deduplication,
  onDeduplicationChange,
  initialConfig,
  warnings,
}: ConfigurationStepProps) {
  const [keyGroups, setKeyGroups] = useState<KeyGroup[]>(() => {
    if (initialConfig?.keyMappings) {
      return initialConfig.keyMappings.map((m) => ({
        colsA: [...m.colsA],
        colsB: [...m.colsB],
        separator: m.separator,
        transform: m.transform,
      }));
    }
    return [];
  });
  const [amountColA, setAmountColA] = useState<number | null>(
    initialConfig?.amountColumnA ?? null
  );
  const [amountColB, setAmountColB] = useState<number | null>(
    initialConfig?.amountColumnB ?? null
  );
  const [error, setError] = useState<string | null>(null);
  const [activeSelection, setActiveSelection] = useState<ActiveSelection>(null);

  const isKeyValidated = (group: KeyGroup) => group.colsA.length > 0 && group.colsB.length > 0;

  const isKeyActive = (index: number) =>
    activeSelection?.type === "key" && activeSelection.groupIndex === index;

  const addKeyGroup = () => {
    const newIndex = keyGroups.length;
    setKeyGroups((prev) => [...prev, { colsA: [], colsB: [], separator: "", transform: "default" }]);
    setActiveSelection({ type: "key", groupIndex: newIndex, side: "A" });
  };

  const removeKeyGroup = (index: number) => {
    setKeyGroups((prev) => prev.filter((_, i) => i !== index));
    if (activeSelection?.type === "key" && activeSelection.groupIndex === index) {
      setActiveSelection(null);
    }
  };

  const removeColFromGroup = (groupIndex: number, side: "A" | "B", colIdx: number) => {
    setKeyGroups((prev) =>
      prev.map((g, i) => {
        if (i !== groupIndex) return g;
        const key = side === "A" ? "colsA" : "colsB";
        return { ...g, [key]: g[key].filter((c) => c !== colIdx) };
      })
    );
  };

  const updateGroupTransform = (index: number, value: KeyTransform) => {
    setKeyGroups((prev) =>
      prev.map((g, i) => (i === index ? { ...g, transform: value } : g))
    );
  };

  const updateGroupSeparator = (index: number, value: string) => {
    setKeyGroups((prev) =>
      prev.map((g, i) => (i === index ? { ...g, separator: value } : g))
    );
  };

  const handleColumnClick = (side: "A" | "B", colIdx: number) => {
    if (!activeSelection || activeSelection.side !== side) return;

    if (activeSelection.type === "key") {
      const { groupIndex } = activeSelection;
      const field = side === "A" ? "colsA" : "colsB";

      setKeyGroups((prev) =>
        prev.map((g, i) => {
          if (i !== groupIndex) return g;
          // Toggle: if already selected, remove it
          if (g[field].includes(colIdx)) {
            return { ...g, [field]: g[field].filter((c) => c !== colIdx) };
          }
          return { ...g, [field]: [...g[field], colIdx] };
        })
      );

      // Auto-advance for 1:1 case: after first click on A, move to B
      const group = keyGroups[groupIndex];
      if (side === "A" && group.colsA.length === 0) {
        // This is the first click on A (group hasn't been updated yet, so check length 0)
        setTimeout(() => {
          setActiveSelection({ type: "key", groupIndex, side: "B" });
        }, 0);
      } else if (side === "B" && group.colsB.length === 0) {
        // First click on B: auto-complete
        setTimeout(() => {
          setActiveSelection(null);
        }, 0);
      }
    } else if (activeSelection.type === "amount") {
      if (side === "A") {
        setAmountColA(colIdx);
        setActiveSelection({ type: "amount", side: "B" });
      } else {
        setAmountColB(colIdx);
        setActiveSelection(null);
      }
    }
  };

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeSelection) {
        if (activeSelection.type === "key") {
          const group = keyGroups[activeSelection.groupIndex];
          if (group && group.colsA.length === 0 && group.colsB.length === 0) {
            removeKeyGroup(activeSelection.groupIndex);
          }
        }
        setActiveSelection(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeSelection, keyGroups]);

  const handleSubmit = () => {
    setError(null);
    setActiveSelection(null);

    const validGroups = keyGroups.filter(isKeyValidated);

    if (validGroups.length === 0) {
      setError("Ajoutez au moins une cl\u00e9 de rapprochement");
      return;
    }

    const incompleteGroups = keyGroups.filter((g) => !isKeyValidated(g));
    if (incompleteGroups.length > 0) {
      setError("Certaines cl\u00e9s ne sont pas compl\u00e8tes. Terminez-les ou supprimez-les.");
      return;
    }

    // Validate separator for multi-column keys
    for (let i = 0; i < validGroups.length; i++) {
      const g = validGroups[i];
      if ((g.colsA.length > 1 || g.colsB.length > 1) && g.separator.length === 0) {
        setError(`La cl\u00e9 ${i + 1} a plusieurs colonnes mais pas de s\u00e9parateur. Ajoutez un s\u00e9parateur pour \u00e9viter les collisions.`);
        return;
      }
    }

    if (
      (amountColA !== null && amountColB === null) ||
      (amountColA === null && amountColB !== null)
    ) {
      setError(
        "Veuillez s\u00e9lectionner la colonne de montant pour les deux fichiers, ou aucun des deux"
      );
      return;
    }

    const keyMappings: KeyMapping[] = validGroups.map((g) => ({
      colsA: g.colsA,
      colsB: g.colsB,
      separator: g.separator,
      transform: g.transform,
    }));

    onSubmit({
      keyMappings,
      amountColumnA: amountColA,
      amountColumnB: amountColB,
    });
  };

  const getColName = (file: ParsedFile, colIdx: number) => {
    return file.headers[colIdx] || `Col ${colIdx + 1}`;
  };

  const getSampleValues = (file: ParsedFile, cols: number[], maxSamples = 2) => {
    return file.rows.slice(0, maxSamples).map((row) =>
      cols.map((c) => row[c] ?? "").join(", ")
    );
  };

  const selectionInstruction = (() => {
    if (!activeSelection) return null;
    const file = activeSelection.side === "A" ? fileA : fileB;
    const fileName = baseName(file.fileName);
    if (activeSelection.type === "key") {
      const color = PAIR_COLORS[activeSelection.groupIndex % PAIR_COLORS.length];
      return (
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
            color.bg,
            color.text
          )}
        >
          <span>
            Cliquez sur une colonne dans{" "}
            <span className="font-bold">{fileName}</span>{" "}
            pour la Cl\u00e9 {activeSelection.groupIndex + 1}
            {activeSelection.side === "A" && keyGroups[activeSelection.groupIndex]?.colsA.length > 0 && (
              <span className="ml-1 opacity-60">(ou cliquez &ldquo;Suivant&rdquo; pour passer au fichier B)</span>
            )}
          </span>
          <button
            onClick={() => setActiveSelection(null)}
            className="ml-auto text-xs opacity-60 hover:opacity-100"
          >
            Annuler
          </button>
        </div>
      );
    }
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
          AMOUNT_COLOR.bg,
          AMOUNT_COLOR.text
        )}
      >
        <span>
          Cliquez sur une colonne dans{" "}
          <span className="font-bold">{fileName}</span>{" "}
          pour le Montant
        </span>
        <button
          onClick={() => setActiveSelection(null)}
          className="ml-auto text-xs opacity-60 hover:opacity-100"
        >
          Annuler
        </button>
      </div>
    );
  })();

  const previewsCollapsed = activeSelection === null;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        D\u00e9finissez les cl\u00e9s de rapprochement entre vos deux fichiers
      </p>

      {selectionInstruction}

      {/* Key list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cl\u00e9s de rapprochement</CardTitle>
          <CardDescription>
            Ajoutez une cl\u00e9, puis s\u00e9lectionnez la colonne correspondante dans chaque fichier
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {keyGroups.length === 0 && !activeSelection && (
            <p className="text-sm text-muted-foreground italic py-2">
              Aucune cl\u00e9 d\u00e9finie. Ajoutez une cl\u00e9 pour commencer.
            </p>
          )}
          {keyGroups.map((group, index) => {
            const color = PAIR_COLORS[index % PAIR_COLORS.length];
            const validated = isKeyValidated(group);
            const active = isKeyActive(index);
            const isActiveA =
              activeSelection?.type === "key" &&
              activeSelection.groupIndex === index &&
              activeSelection.side === "A";
            const isActiveB =
              activeSelection?.type === "key" &&
              activeSelection.groupIndex === index &&
              activeSelection.side === "B";
            const hasMultipleCols = group.colsA.length > 1 || group.colsB.length > 1;

            return (
              <div
                key={index}
                className={cn(
                  "flex flex-col gap-2 rounded-lg px-3 py-3 transition-all",
                  validated && !active
                    ? `${color.cellBg} border border-transparent`
                    : active
                    ? `bg-muted/30 border ${color.activeBorder}`
                    : "border border-dashed border-muted-foreground/30"
                )}
              >
                <div className="flex items-center gap-2">
                  {/* Validation indicator + badge */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {validated && !active ? (
                      <span className="text-green-600 text-sm">&#10003;</span>
                    ) : (
                      <span className="text-muted-foreground/40 text-sm">&#9675;</span>
                    )}
                    <span
                      className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        color.badge
                      )}
                    >
                      Cl\u00e9 {index + 1}
                    </span>
                  </div>

                  {/* Columns A - chips */}
                  <div
                    className={cn(
                      "flex-1 flex items-center gap-1 flex-wrap min-h-[28px] px-2 py-1 rounded border text-sm transition-all",
                      isActiveA
                        ? `${color.bg} ${color.text} ${color.activeBorder} ring-2 ${color.ring}`
                        : group.colsA.length > 0
                        ? `${color.bg} ${color.text} border-transparent`
                        : "text-muted-foreground border-dashed border-muted-foreground/40"
                    )}
                    onClick={() =>
                      setActiveSelection({ type: "key", groupIndex: index, side: "A" })
                    }
                  >
                    {group.colsA.length > 0 ? (
                      group.colsA.map((colIdx, ci) => (
                        <span key={colIdx} className="flex items-center gap-0.5">
                          {ci > 0 && group.separator && (
                            <span className="text-xs opacity-50 mx-0.5">{group.separator}</span>
                          )}
                          <span className={cn("px-1.5 py-0.5 rounded text-xs", color.badge)}>
                            {getColName(fileA, colIdx)}
                            {(active || isActiveA) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeColFromGroup(index, "A", colIdx);
                                }}
                                className="ml-1 opacity-60 hover:opacity-100"
                              >
                                \u00d7
                              </button>
                            )}
                          </span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs opacity-60">
                        {isActiveA ? "\u2190 cliquez dans le tableau" : `Choisir dans ${baseName(fileA.fileName)}`}
                      </span>
                    )}
                    {isActiveA && group.colsA.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSelection({ type: "key", groupIndex: index, side: "B" });
                        }}
                        className={cn("text-xs ml-auto px-1.5 py-0.5 rounded", color.badge, "opacity-80 hover:opacity-100")}
                      >
                        Suivant \u2192
                      </button>
                    )}
                  </div>

                  <span className="text-muted-foreground text-sm flex-shrink-0">&#8596;</span>

                  {/* Columns B - chips */}
                  <div
                    className={cn(
                      "flex-1 flex items-center gap-1 flex-wrap min-h-[28px] px-2 py-1 rounded border text-sm transition-all",
                      isActiveB
                        ? `${color.bg} ${color.text} ${color.activeBorder} ring-2 ${color.ring}`
                        : group.colsB.length > 0
                        ? `${color.bg} ${color.text} border-transparent`
                        : "text-muted-foreground border-dashed border-muted-foreground/40"
                    )}
                    onClick={() =>
                      setActiveSelection({ type: "key", groupIndex: index, side: "B" })
                    }
                  >
                    {group.colsB.length > 0 ? (
                      group.colsB.map((colIdx, ci) => (
                        <span key={colIdx} className="flex items-center gap-0.5">
                          {ci > 0 && group.separator && (
                            <span className="text-xs opacity-50 mx-0.5">{group.separator}</span>
                          )}
                          <span className={cn("px-1.5 py-0.5 rounded text-xs", color.badge)}>
                            {getColName(fileB, colIdx)}
                            {(active || isActiveB) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeColFromGroup(index, "B", colIdx);
                                }}
                                className="ml-1 opacity-60 hover:opacity-100"
                              >
                                \u00d7
                              </button>
                            )}
                          </span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs opacity-60">
                        {isActiveB ? "\u2190 cliquez dans le tableau" : `Choisir dans ${baseName(fileB.fileName)}`}
                      </span>
                    )}
                    {isActiveB && group.colsB.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSelection(null);
                        }}
                        className={cn("text-xs ml-auto px-1.5 py-0.5 rounded", color.badge, "opacity-80 hover:opacity-100")}
                      >
                        Terminer \u2713
                      </button>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeKeyGroup(index)}
                    className="h-7 w-7 p-0 flex-shrink-0"
                  >
                    &#10005;
                  </Button>
                </div>

                {/* Separator input - show when multi-column */}
                {hasMultipleCols && (
                  <div className="flex items-center gap-2 pl-[72px]">
                    <Label
                      htmlFor={`separator-${index}`}
                      className="text-xs text-muted-foreground whitespace-nowrap"
                    >
                      S\u00e9parateur :
                    </Label>
                    <input
                      id={`separator-${index}`}
                      type="text"
                      value={group.separator}
                      onChange={(e) => updateGroupSeparator(index, e.target.value)}
                      placeholder="ex: - ou _"
                      className="w-24 text-xs border rounded px-2 py-1"
                    />
                  </div>
                )}

                {/* Transform - show when validated or active */}
                {(validated || active) && (
                  <div className="flex items-center gap-2 pl-[72px]">
                    <Label
                      htmlFor={`transform-${index}`}
                      className="text-xs text-muted-foreground whitespace-nowrap"
                    >
                      Transformation :
                    </Label>
                    <TransformSelect
                      id={`transform-${index}`}
                      value={group.transform}
                      onChange={(v) => updateGroupTransform(index, v)}
                    />
                  </div>
                )}

                {/* Live key preview */}
                {(validated || (group.colsA.length > 0 || group.colsB.length > 0)) && (
                  <div className="pl-[72px]">
                    <KeyPreview fileA={fileA} fileB={fileB} group={group} color={color} />
                  </div>
                )}

                {/* Sample values for validated keys */}
                {validated && !active && (
                  <div className="flex gap-4 pl-[72px] text-[10px] text-muted-foreground">
                    <div>
                      {getSampleValues(fileA, group.colsA).map((v, i) => (
                        <div key={i} className="truncate max-w-[200px]">{v}</div>
                      ))}
                    </div>
                    <div>
                      {getSampleValues(fileB, group.colsB).map((v, i) => (
                        <div key={i} className="truncate max-w-[200px]">{v}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <Button variant="outline" size="sm" onClick={addKeyGroup} className="w-fit">
            + Ajouter une cl\u00e9
          </Button>
        </CardContent>
      </Card>

      {/* Spreadsheet previews - collapsible */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium mb-1.5">{baseName(fileA.fileName)}</p>
          <SpreadsheetPreview
            file={fileA}
            side="A"
            keyGroups={keyGroups}
            amountCol={amountColA}
            activeSelection={activeSelection}
            onColumnClick={(colIdx) => handleColumnClick("A", colIdx)}
            collapsed={previewsCollapsed}
          />
        </div>
        <div>
          <p className="text-sm font-medium mb-1.5">{baseName(fileB.fileName)}</p>
          <SpreadsheetPreview
            file={fileB}
            side="B"
            keyGroups={keyGroups}
            amountCol={amountColB}
            activeSelection={activeSelection}
            onColumnClick={(colIdx) => handleColumnClick("B", colIdx)}
            collapsed={previewsCollapsed}
          />
        </div>
      </div>

      {/* Amount column */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Colonne de montant</CardTitle>
          <CardDescription>
            Optionnel \u2014 permet de d\u00e9tecter les \u00e9carts de montants entre lignes correspondantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSelection({ type: "amount", side: "A" })}
              className={cn(
                "flex-1 text-sm px-2 py-1.5 rounded border text-left truncate transition-all",
                activeSelection?.type === "amount" && activeSelection.side === "A"
                  ? `${AMOUNT_COLOR.bg} ${AMOUNT_COLOR.text} ${AMOUNT_COLOR.activeBorder} ring-2 ${AMOUNT_COLOR.ring}`
                  : amountColA !== null
                  ? `${AMOUNT_COLOR.bg} ${AMOUNT_COLOR.text} border-transparent hover:${AMOUNT_COLOR.activeBorder}`
                  : "text-muted-foreground border-dashed border-muted-foreground/40 hover:border-muted-foreground/70"
              )}
            >
              {amountColA !== null
                ? getColName(fileA, amountColA)
                : `Choisir dans ${baseName(fileA.fileName)}`}
            </button>
            <span className="text-muted-foreground text-sm flex-shrink-0">&#8596;</span>
            <button
              onClick={() => setActiveSelection({ type: "amount", side: "B" })}
              className={cn(
                "flex-1 text-sm px-2 py-1.5 rounded border text-left truncate transition-all",
                activeSelection?.type === "amount" && activeSelection.side === "B"
                  ? `${AMOUNT_COLOR.bg} ${AMOUNT_COLOR.text} ${AMOUNT_COLOR.activeBorder} ring-2 ${AMOUNT_COLOR.ring}`
                  : amountColB !== null
                  ? `${AMOUNT_COLOR.bg} ${AMOUNT_COLOR.text} border-transparent hover:${AMOUNT_COLOR.activeBorder}`
                  : "text-muted-foreground border-dashed border-muted-foreground/40 hover:border-muted-foreground/70"
              )}
            >
              {amountColB !== null
                ? getColName(fileB, amountColB)
                : `Choisir dans ${baseName(fileB.fileName)}`}
            </button>
            {(amountColA !== null || amountColB !== null) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAmountColA(null);
                  setAmountColB(null);
                }}
                className="h-7 w-7 p-0 flex-shrink-0 text-muted-foreground"
              >
                &#10005;
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Deduplication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              id="dedup"
              checked={deduplication}
              onCheckedChange={onDeduplicationChange}
            />
            <Label htmlFor="dedup">
              D\u00e9dupliquer les lignes ayant la m\u00eame cl\u00e9
            </Label>
          </div>
          {deduplication && (
            <p className="text-xs text-muted-foreground mt-2">
              Les lignes en double bas\u00e9es sur la cl\u00e9 d\u00e9finie seront regroup\u00e9es.
              Seule la premi\u00e8re occurrence sera utilis\u00e9e.
            </p>
          )}
        </CardContent>
      </Card>

      {warnings && warnings.length > 0 && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
          <p className="text-sm font-medium text-orange-700 mb-1">
            Colonnes du mod\u00e8le non trouv\u00e9es :
          </p>
          <ul className="text-sm text-orange-600 list-disc list-inside">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
          <p className="text-xs text-orange-500 mt-1">
            Corrigez le mapping manuellement avant de lancer le rapprochement.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Retour
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Traitement en cours..." : "Lancer le rapprochement"}
        </Button>
      </div>
    </div>
  );
}

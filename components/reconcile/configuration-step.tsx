"use client";

import { Fragment, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  separatorsA: string[];
  separatorsB: string[];
  transform: KeyTransform;
}

interface KeyDialogState {
  mode: "create" | "edit";
  index: number | null;
  draft: KeyGroup;
  error: string | null;
}

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

const MAX_PREVIEW_ROWS = 5;

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
      <option value="alphanumeric_only">Alphanumerique uniquement</option>
      <option value="extract_code_prefix">Extraire le code</option>
      <option value="absolute_amount">Valeur absolue</option>
    </select>
  );
}

function baseName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "");
}

function createEmptyKeyGroup(): KeyGroup {
  return {
    colsA: [],
    colsB: [],
    separator: "",
    separatorsA: [],
    separatorsB: [],
    transform: "default",
  };
}

function cloneKeyGroup(group: KeyGroup): KeyGroup {
  return {
    colsA: [...group.colsA],
    colsB: [...group.colsB],
    separator: group.separator,
    separatorsA: [...group.separatorsA],
    separatorsB: [...group.separatorsB],
    transform: group.transform,
  };
}

function validateKeyGroup(group: KeyGroup): string | null {
  if (group.colsA.length === 0 || group.colsB.length === 0) {
    return "Selectionnez une colonne dans chaque fichier.";
  }

  return null;
}

function fillSeparators(columns: number[], existing: string[], fallback: string): string[] {
  const needed = Math.max(0, columns.length - 1);
  if (existing.length === needed) return existing;
  const next: string[] = [];
  for (let i = 0; i < needed; i++) {
    next.push(existing[i] ?? fallback);
  }
  return next;
}

function KeyChips({
  file,
  columns,
  color,
  emptyLabel,
  onRemove,
}: {
  file: ParsedFile;
  columns: number[];
  color: (typeof PAIR_COLORS)[number];
  emptyLabel: string;
  onRemove?: (colIdx: number) => void;
}) {
  if (columns.length === 0) {
    return <span className="text-xs text-muted-foreground">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {columns.map((colIdx) => (
        <span
          key={colIdx}
          className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs", color.badge)}
        >
          {file.headers[colIdx] || `Col ${colIdx + 1}`}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(colIdx)}
              className="opacity-70 hover:opacity-100 leading-none"
              aria-label="Retirer"
            >
              ×
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

function EditableKeyChips({
  file,
  columns,
  separators,
  color,
  emptyLabel,
  onRemove,
  onSeparatorChange,
}: {
  file: ParsedFile;
  columns: number[];
  separators: string[];
  color: (typeof PAIR_COLORS)[number];
  emptyLabel: string;
  onRemove: (position: number) => void;
  onSeparatorChange: (position: number, value: string) => void;
}) {
  if (columns.length === 0) {
    return <span className="text-xs text-muted-foreground">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {columns.map((colIdx, position) => (
        <Fragment key={position}>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs",
              color.badge
            )}
          >
            {file.headers[colIdx] || `Col ${colIdx + 1}`}
            <button
              type="button"
              onClick={() => onRemove(position)}
              className="opacity-70 hover:opacity-100 leading-none"
              aria-label="Retirer"
            >
              ×
            </button>
          </span>
          {position < columns.length - 1 && (
            <input
              type="text"
              value={separators[position] ?? ""}
              onChange={(e) => onSeparatorChange(position, e.target.value)}
              placeholder="sep"
              aria-label={`Separateur apres la colonne ${position + 1}`}
              className="h-6 w-12 rounded border border-input bg-transparent px-1 text-center text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}

function SpreadsheetPreview({
  file,
  side,
  group,
  color,
  onColumnClick,
}: {
  file: ParsedFile;
  side: "A" | "B";
  group: KeyGroup;
  color: (typeof PAIR_COLORS)[number];
  onColumnClick: (colIdx: number) => void;
}) {
  const previewRows = file.rows.slice(0, MAX_PREVIEW_ROWS);
  const selectedCols = side === "A" ? group.colsA : group.colsB;

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto max-h-56">
        <table className="text-xs border-collapse w-full min-w-max">
          <thead className="sticky top-0 z-10">
            <tr className="bg-background border-b">
              {file.headers.map((header, colIdx) => {
                const isSelected = selectedCols.includes(colIdx);
                return (
                  <th
                    key={colIdx}
                    onClick={() => onColumnClick(colIdx)}
                    className={cn(
                      "px-2.5 py-2 text-left font-medium whitespace-nowrap border-r last:border-r-0 select-none transition-colors cursor-pointer hover:bg-primary/10",
                      isSelected ? `${color.bg} ${color.text}` : "text-muted-foreground bg-muted/20"
                    )}
                  >
                    {header || `Col ${colIdx + 1}`}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b last:border-b-0 hover:bg-muted/10">
                {file.headers.map((_, colIdx) => (
                  <td
                    key={colIdx}
                    className={cn(
                      "px-2.5 py-1 border-r last:border-r-0 max-w-[120px] truncate",
                      selectedCols.includes(colIdx) ? color.cellBg : ""
                    )}
                  >
                    {row[colIdx] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
            {file.rows.length > MAX_PREVIEW_ROWS && (
              <tr>
                <td
                  colSpan={file.headers.length}
                  className="px-2.5 py-1 text-center text-muted-foreground text-[10px] italic"
                >
                  ... {file.rows.length - MAX_PREVIEW_ROWS} lignes supplementaires
                </td>
              </tr>
            )}
          </tbody>
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

  const buildPreview = (cols: number[], seps: string[], row: string[] | undefined) => {
    if (!row || cols.length === 0) return null;
    const parts = cols.map((c) => applyTransform(row[c] ?? "", group.transform));
    if (parts.length === 1) return parts[0];
    const filled = fillSeparators(cols, seps, group.separator);
    let out = parts[0];
    for (let i = 1; i < parts.length; i++) {
      out += (filled[i - 1] ?? group.separator) + parts[i];
    }
    return out;
  };

  const previewA = buildPreview(group.colsA, group.separatorsA, row0A);
  const previewB = buildPreview(group.colsB, group.separatorsB, row0B);
  const match = previewA !== null && previewB !== null && previewA === previewB;

  return (
    <div className={cn("text-xs px-3 py-1.5 rounded", color.bg, color.text)}>
      <span className="opacity-70">Apercu : </span>
      {previewA !== null && <span className="font-mono font-medium">&quot;{previewA}&quot;</span>}
      {previewA !== null && previewB !== null && <span className="mx-1.5">↔</span>}
      {previewB !== null && <span className="font-mono font-medium">&quot;{previewB}&quot;</span>}
      {match && <span className="ml-1.5 text-green-700">✓</span>}
      {previewA !== null && previewB !== null && !match && (
        <span className="ml-1.5 text-red-600">✗</span>
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
      return initialConfig.keyMappings.map((mapping) => ({
        colsA: [...mapping.colsA],
        colsB: [...mapping.colsB],
        separator: mapping.separator,
        separatorsA: fillSeparators(mapping.colsA, mapping.separatorsA ?? [], mapping.separator),
        separatorsB: fillSeparators(mapping.colsB, mapping.separatorsB ?? [], mapping.separator),
        transform: mapping.transform,
      }));
    }

    return [];
  });
  const [amountColA, setAmountColA] = useState<number | null>(initialConfig?.amountColumnA ?? null);
  const [amountColB, setAmountColB] = useState<number | null>(initialConfig?.amountColumnB ?? null);
  const [error, setError] = useState<string | null>(null);
  const [keyDialog, setKeyDialog] = useState<KeyDialogState | null>(null);

  const isKeyValidated = (group: KeyGroup) => group.colsA.length > 0 && group.colsB.length > 0;

  const removeKeyGroup = useCallback((index: number) => {
    setKeyGroups((prev) => prev.filter((_, i) => i !== index));
    setKeyDialog((prev) => {
      if (prev?.mode === "edit" && prev.index === index) {
        return null;
      }
      return prev;
    });
  }, []);

  const openCreateDialog = useCallback(() => {
    setKeyDialog({
      mode: "create",
      index: null,
      draft: createEmptyKeyGroup(),
      error: null,
    });
  }, []);

  const openEditDialog = useCallback((index: number) => {
    setKeyDialog({
      mode: "edit",
      index,
      draft: cloneKeyGroup(keyGroups[index]),
      error: null,
    });
  }, [keyGroups]);

  const closeKeyDialog = useCallback(() => {
    setKeyDialog(null);
  }, []);

  const updateDialogDraft = useCallback((updater: (draft: KeyGroup) => KeyGroup) => {
    setKeyDialog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        draft: updater(prev.draft),
        error: null,
      };
    });
  }, []);

  const handleDialogColumnClick = useCallback((side: "A" | "B", colIdx: number) => {
    setKeyDialog((prev) => {
      if (!prev) return prev;

      const colsField = side === "A" ? "colsA" : "colsB";
      const sepsField = side === "A" ? "separatorsA" : "separatorsB";
      const existingCols = prev.draft[colsField];
      const existingSeps = prev.draft[sepsField];
      const isRemoving = existingCols.includes(colIdx);

      let nextCols: number[];
      let nextSeps: string[];

      if (isRemoving) {
        const position = existingCols.indexOf(colIdx);
        nextCols = existingCols.filter((_, i) => i !== position);
        if (existingSeps.length === 0) {
          nextSeps = [];
        } else {
          const dropIdx = Math.min(position, existingSeps.length - 1);
          nextSeps = existingSeps.filter((_, i) => i !== dropIdx);
        }
      } else {
        nextCols = [...existingCols, colIdx];
        nextSeps = existingCols.length > 0 ? [...existingSeps, ""] : existingSeps;
      }

      return {
        ...prev,
        draft: {
          ...prev.draft,
          [colsField]: nextCols,
          [sepsField]: nextSeps,
        },
        error: null,
      };
    });
  }, []);

  const handleSeparatorChange = useCallback(
    (side: "A" | "B", position: number, value: string) => {
      setKeyDialog((prev) => {
        if (!prev) return prev;
        const sepsField = side === "A" ? "separatorsA" : "separatorsB";
        const current = prev.draft[sepsField];
        if (position < 0 || position >= current.length) return prev;
        const next = [...current];
        next[position] = value;
        return {
          ...prev,
          draft: {
            ...prev.draft,
            [sepsField]: next,
          },
          error: null,
        };
      });
    },
    []
  );

  const saveKeyDialog = useCallback(() => {
    if (!keyDialog) return;

    const validationError = validateKeyGroup(keyDialog.draft);
    if (validationError) {
      setKeyDialog((prev) => (prev ? { ...prev, error: validationError } : prev));
      return;
    }

    if (keyDialog.mode === "create") {
      setKeyGroups((prev) => [...prev, cloneKeyGroup(keyDialog.draft)]);
    } else if (keyDialog.index !== null) {
      setKeyGroups((prev) =>
        prev.map((group, index) => (index === keyDialog.index ? cloneKeyGroup(keyDialog.draft) : group))
      );
    }

    setKeyDialog(null);
  }, [keyDialog]);

  const handleSubmit = () => {
    setError(null);

    const validGroups = keyGroups.filter(isKeyValidated);

    if (validGroups.length === 0) {
      setError("Ajoutez au moins une cle de rapprochement");
      return;
    }

    const incompleteGroups = keyGroups.filter((group) => !isKeyValidated(group));
    if (incompleteGroups.length > 0) {
      setError("Certaines cles ne sont pas completes.");
      return;
    }

    if (
      (amountColA !== null && amountColB === null) ||
      (amountColA === null && amountColB !== null)
    ) {
      setError("Selectionnez la colonne de montant pour les deux fichiers, ou aucun des deux.");
      return;
    }

    const keyMappings: KeyMapping[] = validGroups.map((group) => ({
      colsA: group.colsA,
      colsB: group.colsB,
      separator: group.separator,
      separatorsA: fillSeparators(group.colsA, group.separatorsA, group.separator),
      separatorsB: fillSeparators(group.colsB, group.separatorsB, group.separator),
      transform: group.transform,
    }));

    onSubmit({
      keyMappings,
      amountColumnA: amountColA,
      amountColumnB: amountColB,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cles de rapprochement</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {keyGroups.length === 0 && (
            <p className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
              Aucune cle de rapprochement
            </p>
          )}

          {keyGroups.map((group, index) => {
            const color = PAIR_COLORS[index % PAIR_COLORS.length];

            return (
              <div
                key={index}
                className={cn(
                  "flex flex-col gap-3 rounded-lg border px-3 py-3",
                  isKeyValidated(group) ? color.cellBg : "border-dashed border-muted-foreground/30"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", color.badge)}>
                      Cle {index + 1}
                    </span>
                    {isKeyValidated(group) && <span className="text-green-600 text-sm">✓</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(index)}>
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeKeyGroup(index)}
                      className="h-8 w-8 p-0"
                    >
                      x
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">{baseName(fileA.fileName)}</p>
                    <KeyChips
                      file={fileA}
                      columns={group.colsA}
                      color={color}
                      emptyLabel="Aucune colonne"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">{baseName(fileB.fileName)}</p>
                    <KeyChips
                      file={fileB}
                      columns={group.colsB}
                      color={color}
                      emptyLabel="Aucune colonne"
                    />
                  </div>
                </div>

                {group.transform !== "default" && (
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>Transformation : {group.transform}</span>
                  </div>
                )}

                <KeyPreview fileA={fileA} fileB={fileB} group={group} color={color} />
              </div>
            );
          })}

          <Button variant="outline" size="sm" onClick={openCreateDialog} className="w-fit">
            Ajouter une cle de rapprochement
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Montants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount-col-a">{baseName(fileA.fileName)}</Label>
              <select
                id="amount-col-a"
                value={amountColA ?? ""}
                onChange={(e) => setAmountColA(e.target.value === "" ? null : Number(e.target.value))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Aucune colonne</option>
                {fileA.headers.map((header, index) => (
                  <option key={index} value={index}>
                    {header || `Col ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount-col-b">{baseName(fileB.fileName)}</Label>
              <select
                id="amount-col-b"
                value={amountColB ?? ""}
                onChange={(e) => setAmountColB(e.target.value === "" ? null : Number(e.target.value))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Aucune colonne</option>
                {fileB.headers.map((header, index) => (
                  <option key={index} value={index}>
                    {header || `Col ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(amountColA !== null || amountColB !== null) && (
            <div className="pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAmountColA(null);
                  setAmountColB(null);
                }}
                className="px-0 text-muted-foreground"
              >
                Reinitialiser les montants
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
            <Label htmlFor="dedup">Dedupliquer les lignes ayant la meme cle</Label>
          </div>
          {deduplication && (
            <p className="text-xs text-muted-foreground mt-2">
              Seule la premiere occurrence sera utilisee.
            </p>
          )}
        </CardContent>
      </Card>

      {warnings && warnings.length > 0 && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
          <p className="text-sm font-medium text-orange-700 mb-1">Colonnes introuvables :</p>
          <ul className="text-sm text-orange-600 list-disc list-inside">
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
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

      <Dialog open={keyDialog !== null} onOpenChange={(open) => !open && closeKeyDialog()}>
        {keyDialog && (
          <DialogContent className="sm:max-w-6xl">
            <DialogHeader>
              <DialogTitle>
                {keyDialog.mode === "create" ? "Ajouter une cle" : `Modifier la cle ${keyDialog.index! + 1}`}
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="grid gap-2 md:grid-cols-[140px_1fr] md:items-center">
                <Label htmlFor="dialog-transform">Transformation</Label>
                <TransformSelect
                  id="dialog-transform"
                  value={keyDialog.draft.transform}
                  onChange={(value) =>
                    updateDialogDraft((draft) => ({ ...draft, transform: value }))
                  }
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Cliquez sur une colonne pour l&apos;ajouter ou la retirer de la cle.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">{baseName(fileA.fileName)}</p>
                  <SpreadsheetPreview
                    file={fileA}
                    side="A"
                    group={keyDialog.draft}
                    color={PAIR_COLORS[(keyDialog.index ?? keyGroups.length) % PAIR_COLORS.length]}
                    onColumnClick={(colIdx) => handleDialogColumnClick("A", colIdx)}
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">{baseName(fileB.fileName)}</p>
                  <SpreadsheetPreview
                    file={fileB}
                    side="B"
                    group={keyDialog.draft}
                    color={PAIR_COLORS[(keyDialog.index ?? keyGroups.length) % PAIR_COLORS.length]}
                    onColumnClick={(colIdx) => handleDialogColumnClick("B", colIdx)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Colonnes selectionnees</p>
                  <EditableKeyChips
                    file={fileA}
                    columns={keyDialog.draft.colsA}
                    separators={keyDialog.draft.separatorsA}
                    color={PAIR_COLORS[(keyDialog.index ?? keyGroups.length) % PAIR_COLORS.length]}
                    emptyLabel="Aucune colonne"
                    onRemove={(position) =>
                      handleDialogColumnClick("A", keyDialog.draft.colsA[position])
                    }
                    onSeparatorChange={(position, value) =>
                      handleSeparatorChange("A", position, value)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Colonnes selectionnees</p>
                  <EditableKeyChips
                    file={fileB}
                    columns={keyDialog.draft.colsB}
                    separators={keyDialog.draft.separatorsB}
                    color={PAIR_COLORS[(keyDialog.index ?? keyGroups.length) % PAIR_COLORS.length]}
                    emptyLabel="Aucune colonne"
                    onRemove={(position) =>
                      handleDialogColumnClick("B", keyDialog.draft.colsB[position])
                    }
                    onSeparatorChange={(position, value) =>
                      handleSeparatorChange("B", position, value)
                    }
                  />
                </div>
              </div>

              <KeyPreview
                fileA={fileA}
                fileB={fileB}
                group={keyDialog.draft}
                color={PAIR_COLORS[(keyDialog.index ?? keyGroups.length) % PAIR_COLORS.length]}
              />

              {keyDialog.error && <p className="text-sm text-red-500">{keyDialog.error}</p>}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeKeyDialog}>
                Annuler
              </Button>
              <Button onClick={saveKeyDialog}>
                {keyDialog.mode === "create" ? "Ajouter" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

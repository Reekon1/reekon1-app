"use client";

import { useState } from "react";
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
import type { ParsedFile, KeyTransform } from "@/lib/reconciliation/types";

export interface ConfigurationConfig {
  keyColumnsA: number[];
  keyColumnsB: number[];
  amountColumnA: number | null;
  amountColumnB: number | null;
  keyTransforms?: KeyTransform[];
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
    keyColumnsA: number[];
    keyColumnsB: number[];
    amountColumnA: number | null;
    amountColumnB: number | null;
    keyTransforms?: KeyTransform[];
  };
  warnings?: string[];
}

interface KeyPair {
  colA: number | null;
  colB: number | null;
  transform: KeyTransform;
}

type ActiveSelection =
  | { type: "key"; pairIndex: number; side: "A" | "B" }
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
      <option value="alphanumeric_only">Alphanumérique uniquement (ex: N°3456 → n3456)</option>
      <option value="extract_code_prefix">Extraire le code (ex: CNFFOKTOS – OKTOS → cnffoktos)</option>
      <option value="absolute_amount">Valeur absolue (ex: -1 234,56 → 1234.56)</option>
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
  keyPairs,
  amountCol,
  activeSelection,
  onColumnClick,
}: {
  file: ParsedFile;
  side: "A" | "B";
  keyPairs: KeyPair[];
  amountCol: number | null;
  activeSelection: ActiveSelection;
  onColumnClick: (colIdx: number) => void;
}) {
  const isTargetSide = activeSelection?.side === side;
  const previewRows = file.rows.slice(0, MAX_PREVIEW_ROWS);

  const getColInfo = (colIdx: number): { color: ColColor; label: string } | null => {
    const keyPairIdx = keyPairs.findIndex(
      (p) => (side === "A" ? p.colA : p.colB) === colIdx
    );
    if (keyPairIdx !== -1) {
      return {
        color: PAIR_COLORS[keyPairIdx % PAIR_COLORS.length],
        label: `Clé ${keyPairIdx + 1}`,
      };
    }
    if (amountCol === colIdx) {
      return { color: AMOUNT_COLOR, label: "Montant" };
    }
    return null;
  };

  return (
    <div
      className={cn(
        "rounded-md border overflow-hidden transition-shadow",
        isTargetSide && "ring-2 ring-primary shadow-md"
      )}
    >
      <div className="overflow-x-auto max-h-56">
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
                  … {file.rows.length - MAX_PREVIEW_ROWS} lignes supplémentaires
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
  const [keyPairs, setKeyPairs] = useState<KeyPair[]>(() => {
    if (initialConfig) {
      return initialConfig.keyColumnsA.map((colA, i) => ({
        colA,
        colB: initialConfig.keyColumnsB[i] ?? null,
        transform: initialConfig.keyTransforms?.[i] ?? "default",
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
  const [activeSelection, setActiveSelection] = useState<ActiveSelection>(
    // If no initial config, auto-start first key creation
    initialConfig ? null : null
  );

  const isKeyValidated = (pair: KeyPair) => pair.colA !== null && pair.colB !== null;

  const isKeyActive = (index: number) =>
    activeSelection?.type === "key" && activeSelection.pairIndex === index;

  const addKeyPair = () => {
    const newIndex = keyPairs.length;
    setKeyPairs((prev) => [...prev, { colA: null, colB: null, transform: "default" }]);
    setActiveSelection({ type: "key", pairIndex: newIndex, side: "A" });
  };

  const removeKeyPair = (index: number) => {
    setKeyPairs((prev) => prev.filter((_, i) => i !== index));
    if (activeSelection?.type === "key" && activeSelection.pairIndex === index) {
      setActiveSelection(null);
    }
  };

  const updateKeyPair = (index: number, field: "colA" | "colB", value: number) => {
    setKeyPairs((prev) =>
      prev.map((pair, i) => (i === index ? { ...pair, [field]: value } : pair))
    );
  };

  const updateKeyPairTransform = (index: number, value: KeyTransform) => {
    setKeyPairs((prev) =>
      prev.map((pair, i) => (i === index ? { ...pair, transform: value } : pair))
    );
  };

  const handleColumnClick = (side: "A" | "B", colIdx: number) => {
    if (!activeSelection || activeSelection.side !== side) return;

    if (activeSelection.type === "key") {
      const { pairIndex } = activeSelection;
      if (side === "A") {
        updateKeyPair(pairIndex, "colA", colIdx);
        setActiveSelection({ type: "key", pairIndex, side: "B" });
      } else {
        updateKeyPair(pairIndex, "colB", colIdx);
        setActiveSelection(null);
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

  const handleSubmit = () => {
    setError(null);
    setActiveSelection(null);

    const validPairs = keyPairs.filter(isKeyValidated);

    if (validPairs.length === 0) {
      setError("Ajoutez au moins une clé de rapprochement");
      return;
    }

    const incompletePairs = keyPairs.filter((p) => !isKeyValidated(p));
    if (incompletePairs.length > 0) {
      setError("Certaines clés ne sont pas complètes. Terminez-les ou supprimez-les.");
      return;
    }

    if (
      (amountColA !== null && amountColB === null) ||
      (amountColA === null && amountColB !== null)
    ) {
      setError(
        "Veuillez sélectionner la colonne de montant pour les deux fichiers, ou aucun des deux"
      );
      return;
    }

    const transforms = validPairs.map((p) => p.transform);
    const hasNonDefault = transforms.some((t) => t !== "default");

    const config: ConfigurationConfig = {
      keyColumnsA: validPairs.map((p) => p.colA!),
      keyColumnsB: validPairs.map((p) => p.colB!),
      amountColumnA: amountColA,
      amountColumnB: amountColB,
      ...(hasNonDefault ? { keyTransforms: transforms } : {}),
    };

    onSubmit(config);
  };

  const getColName = (file: ParsedFile, colIdx: number | null) => {
    if (colIdx === null) return null;
    return file.headers[colIdx] || `Col ${colIdx + 1}`;
  };

  const selectionInstruction = (() => {
    if (!activeSelection) return null;
    const file = activeSelection.side === "A" ? fileA : fileB;
    const fileName = baseName(file.fileName);
    if (activeSelection.type === "key") {
      const color = PAIR_COLORS[activeSelection.pairIndex % PAIR_COLORS.length];
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
            pour la Clé {activeSelection.pairIndex + 1}
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

  // Only pass validated pairs to SpreadsheetPreview for highlighting
  const validatedPairsForPreview: KeyPair[] = keyPairs.map((p) => ({
    colA: p.colA,
    colB: p.colB,
    transform: p.transform,
  }));

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Définissez les clés de rapprochement entre vos deux fichiers
      </p>

      {selectionInstruction}

      {/* Key list — primary section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Clés de rapprochement</CardTitle>
          <CardDescription>
            Ajoutez une clé, puis sélectionnez la colonne correspondante dans chaque fichier
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {keyPairs.length === 0 && !activeSelection && (
            <p className="text-sm text-muted-foreground italic py-2">
              Aucune clé définie. Ajoutez une clé pour commencer.
            </p>
          )}
          {keyPairs.map((pair, index) => {
            const color = PAIR_COLORS[index % PAIR_COLORS.length];
            const validated = isKeyValidated(pair);
            const active = isKeyActive(index);
            const isActiveA =
              activeSelection?.type === "key" &&
              activeSelection.pairIndex === index &&
              activeSelection.side === "A";
            const isActiveB =
              activeSelection?.type === "key" &&
              activeSelection.pairIndex === index &&
              activeSelection.side === "B";

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
                      Clé {index + 1}
                    </span>
                  </div>

                  {/* Column A button */}
                  <button
                    onClick={() =>
                      setActiveSelection({ type: "key", pairIndex: index, side: "A" })
                    }
                    className={cn(
                      "flex-1 text-sm px-2 py-1 rounded border text-left truncate transition-all",
                      isActiveA
                        ? `${color.bg} ${color.text} ${color.activeBorder} ring-2 ${color.ring}`
                        : pair.colA !== null
                        ? `${color.bg} ${color.text} border-transparent hover:${color.activeBorder}`
                        : "text-muted-foreground border-dashed border-muted-foreground/40 hover:border-muted-foreground/70"
                    )}
                  >
                    {pair.colA !== null
                      ? getColName(fileA, pair.colA)
                      : `Choisir dans ${baseName(fileA.fileName)}`}
                    {isActiveA && <span className="ml-1 opacity-60 text-xs">&#8592; cliquez dans le tableau</span>}
                  </button>

                  <span className="text-muted-foreground text-sm flex-shrink-0">&#8596;</span>

                  {/* Column B button */}
                  <button
                    onClick={() =>
                      setActiveSelection({ type: "key", pairIndex: index, side: "B" })
                    }
                    className={cn(
                      "flex-1 text-sm px-2 py-1 rounded border text-left truncate transition-all",
                      isActiveB
                        ? `${color.bg} ${color.text} ${color.activeBorder} ring-2 ${color.ring}`
                        : pair.colB !== null
                        ? `${color.bg} ${color.text} border-transparent hover:${color.activeBorder}`
                        : "text-muted-foreground border-dashed border-muted-foreground/40 hover:border-muted-foreground/70"
                    )}
                  >
                    {pair.colB !== null
                      ? getColName(fileB, pair.colB)
                      : `Choisir dans ${baseName(fileB.fileName)}`}
                    {isActiveB && <span className="ml-1 opacity-60 text-xs">&#8592; cliquez dans le tableau</span>}
                  </button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeKeyPair(index)}
                    className="h-7 w-7 p-0 flex-shrink-0"
                  >
                    &#10005;
                  </Button>
                </div>

                {/* Transform — only show when validated or active */}
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
                      value={pair.transform}
                      onChange={(v) => updateKeyPairTransform(index, v)}
                    />
                  </div>
                )}
              </div>
            );
          })}
          <Button variant="outline" size="sm" onClick={addKeyPair} className="w-fit">
            + Ajouter une clé
          </Button>
        </CardContent>
      </Card>

      {/* Spreadsheet previews — reference for column selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium mb-1.5">{baseName(fileA.fileName)}</p>
          <SpreadsheetPreview
            file={fileA}
            side="A"
            keyPairs={validatedPairsForPreview}
            amountCol={amountColA}
            activeSelection={activeSelection}
            onColumnClick={(colIdx) => handleColumnClick("A", colIdx)}
          />
        </div>
        <div>
          <p className="text-sm font-medium mb-1.5">{baseName(fileB.fileName)}</p>
          <SpreadsheetPreview
            file={fileB}
            side="B"
            keyPairs={validatedPairsForPreview}
            amountCol={amountColB}
            activeSelection={activeSelection}
            onColumnClick={(colIdx) => handleColumnClick("B", colIdx)}
          />
        </div>
      </div>

      {/* Amount column */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Colonne de montant</CardTitle>
          <CardDescription>
            Optionnel — permet de détecter les écarts de montants entre lignes correspondantes
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
              Dédupliquer les lignes ayant la même clé
            </Label>
          </div>
          {deduplication && (
            <p className="text-xs text-muted-foreground mt-2">
              Les lignes en double basées sur la clé définie seront regroupées.
              Seule la première occurrence sera utilisée.
            </p>
          )}
        </CardContent>
      </Card>

      {warnings && warnings.length > 0 && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
          <p className="text-sm font-medium text-orange-700 mb-1">
            Colonnes du modèle non trouvées :
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

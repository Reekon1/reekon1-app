"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ParsedFile, ReconciliationConfig } from "@/lib/reconciliation/types";

interface ConfigureStepProps {
  fileA: ParsedFile;
  fileB: ParsedFile;
  onSubmit: (config: ReconciliationConfig) => void;
  onBack: () => void;
  isLoading: boolean;
  initialConfig?: ReconciliationConfig;
  warnings?: string[];
}

interface KeyPair {
  colA: number;
  colB: number;
}

function ColumnSelect({
  headers,
  value,
  onChange,
  placeholder,
  id,
}: {
  headers: string[];
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder: string;
  id: string;
}) {
  return (
    <select
      id={id}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <option value="">{placeholder}</option>
      {headers.map((h, i) => (
        <option key={i} value={i}>
          {h || `Col ${i + 1}`}
        </option>
      ))}
    </select>
  );
}

export function ConfigureStep({
  fileA,
  fileB,
  onSubmit,
  onBack,
  isLoading,
  initialConfig,
  warnings,
}: ConfigureStepProps) {
  const [keyPairs, setKeyPairs] = useState<KeyPair[]>(() => {
    if (initialConfig) {
      return initialConfig.keyColumnsA.map((colA, i) => ({
        colA,
        colB: initialConfig.keyColumnsB[i] ?? 0,
      }));
    }
    return [{ colA: 0, colB: 0 }];
  });
  const [amountColA, setAmountColA] = useState<number | null>(initialConfig?.amountColumnA ?? null);
  const [amountColB, setAmountColB] = useState<number | null>(initialConfig?.amountColumnB ?? null);
  const [excludeHeaderA, setExcludeHeaderA] = useState(initialConfig?.excludeHeaderRowsA ?? 0);
  const [excludeHeaderB, setExcludeHeaderB] = useState(initialConfig?.excludeHeaderRowsB ?? 0);
  const [excludeFooterA, setExcludeFooterA] = useState(initialConfig?.excludeFooterRowsA ?? 0);
  const [excludeFooterB, setExcludeFooterB] = useState(initialConfig?.excludeFooterRowsB ?? 0);
  const [deduplication, setDeduplication] = useState(initialConfig?.deduplication ?? false);
  const [error, setError] = useState<string | null>(null);

  const addKeyPair = () => {
    setKeyPairs((prev) => [...prev, { colA: 0, colB: 0 }]);
  };

  const removeKeyPair = (index: number) => {
    setKeyPairs((prev) => prev.filter((_, i) => i !== index));
  };

  const updateKeyPair = (index: number, field: "colA" | "colB", value: number) => {
    setKeyPairs((prev) =>
      prev.map((pair, i) => (i === index ? { ...pair, [field]: value } : pair))
    );
  };

  const handleSubmit = () => {
    setError(null);

    if (keyPairs.length === 0) {
      setError("Veuillez sélectionner au moins une colonne clé pour chaque fichier");
      return;
    }

    // Check that amount columns are either both set or both null
    if (
      (amountColA !== null && amountColB === null) ||
      (amountColA === null && amountColB !== null)
    ) {
      setError(
        "Veuillez sélectionner la colonne de montant pour les deux fichiers, ou aucun des deux"
      );
      return;
    }

    const config: ReconciliationConfig = {
      keyColumnsA: keyPairs.map((p) => p.colA),
      keyColumnsB: keyPairs.map((p) => p.colB),
      amountColumnA: amountColA,
      amountColumnB: amountColB,
      excludeHeaderRowsA: excludeHeaderA,
      excludeHeaderRowsB: excludeHeaderB,
      excludeFooterRowsA: excludeFooterA,
      excludeFooterRowsB: excludeFooterB,
      deduplication,
    };

    onSubmit(config);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-bold text-2xl">Configuration du rapprochement</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Définissez les clés de correspondance et les options de traitement
        </p>
      </div>

      {/* Key columns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Clés de rapprochement</CardTitle>
          <CardDescription>
            Sélectionnez les colonnes qui identifient de manière unique chaque
            ligne entre les deux fichiers
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {keyPairs.map((pair, index) => (
            <div key={index} className="flex items-end gap-3">
              <div className="flex-1">
                <Label htmlFor={`key-a-${index}`} className="text-xs text-muted-foreground">
                  Système A
                </Label>
                <ColumnSelect
                  id={`key-a-${index}`}
                  headers={fileA.headers}
                  value={pair.colA}
                  onChange={(v) => updateKeyPair(index, "colA", v ?? 0)}
                  placeholder="Colonne..."
                />
              </div>
              <span className="pb-2 text-muted-foreground">↔</span>
              <div className="flex-1">
                <Label htmlFor={`key-b-${index}`} className="text-xs text-muted-foreground">
                  Système B
                </Label>
                <ColumnSelect
                  id={`key-b-${index}`}
                  headers={fileB.headers}
                  value={pair.colB}
                  onChange={(v) => updateKeyPair(index, "colB", v ?? 0)}
                  placeholder="Colonne..."
                />
              </div>
              {keyPairs.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeKeyPair(index)}
                  className="pb-2"
                >
                  ✕
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addKeyPair} className="w-fit">
            + Ajouter une colonne à la clé
          </Button>
        </CardContent>
      </Card>

      {/* Amount columns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Colonne de montant</CardTitle>
          <CardDescription>
            Optionnel — permet de détecter les écarts de montants entre lignes
            correspondantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="amount-a" className="text-xs text-muted-foreground">
                Système A
              </Label>
              <ColumnSelect
                id="amount-a"
                headers={fileA.headers}
                value={amountColA}
                onChange={setAmountColA}
                placeholder="Aucune"
              />
            </div>
            <span className="pb-2 text-muted-foreground">↔</span>
            <div className="flex-1">
              <Label htmlFor="amount-b" className="text-xs text-muted-foreground">
                Système B
              </Label>
              <ColumnSelect
                id="amount-b"
                headers={fileB.headers}
                value={amountColB}
                onChange={setAmountColB}
                placeholder="Aucune"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exclusions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Options de nettoyage</CardTitle>
          <CardDescription>
            Exclure des lignes d&apos;en-tête ou de pied de page du traitement
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="header-a" className="text-xs text-muted-foreground">
                Lignes d&apos;en-tête à ignorer — Système A
              </Label>
              <Input
                id="header-a"
                type="number"
                min={0}
                value={excludeHeaderA}
                onChange={(e) => setExcludeHeaderA(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="header-b" className="text-xs text-muted-foreground">
                Lignes d&apos;en-tête à ignorer — Système B
              </Label>
              <Input
                id="header-b"
                type="number"
                min={0}
                value={excludeHeaderB}
                onChange={(e) => setExcludeHeaderB(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="footer-a" className="text-xs text-muted-foreground">
                Lignes de pied de page à ignorer — Système A
              </Label>
              <Input
                id="footer-a"
                type="number"
                min={0}
                value={excludeFooterA}
                onChange={(e) => setExcludeFooterA(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="footer-b" className="text-xs text-muted-foreground">
                Lignes de pied de page à ignorer — Système B
              </Label>
              <Input
                id="footer-b"
                type="number"
                min={0}
                value={excludeFooterB}
                onChange={(e) => setExcludeFooterB(Number(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deduplication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Déduplication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              id="dedup"
              checked={deduplication}
              onCheckedChange={setDeduplication}
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

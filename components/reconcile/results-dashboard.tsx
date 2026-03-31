"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { generateReport, downloadBlob } from "@/lib/reconciliation/report";
import type { ParsedFile, ReconciliationConfig, ReconciliationResult, ManualMatch } from "@/lib/reconciliation/types";
import { SaveTemplateDialog } from "@/components/reconcile/save-template-dialog";

interface ResultsDashboardProps {
  result: ReconciliationResult;
  fileA: ParsedFile;
  fileB: ParsedFile;
  config: ReconciliationConfig;
  onNewReconciliation: () => void;
  onManualReconciliation?: () => void;
  manualMatches?: ManualMatch[];
  manualStep?: "none" | "computing" | "selecting" | "done";
  computeProgress?: { current: number; total: number };
}

function baseName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "");
}

function formatAmount(n: number): string {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function MatchRateIndicator({ rate }: { rate: number }) {
  let color = "text-red-600 bg-red-50 border-red-200";
  let label = "Faible";
  if (rate >= 90) {
    color = "text-green-600 bg-green-50 border-green-200";
    label = "Excellent";
  } else if (rate >= 50) {
    color = "text-orange-600 bg-orange-50 border-orange-200";
    label = "Moyen";
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${color}`}>
      {rate}% — {label}
    </div>
  );
}

function DetailTable({
  title,
  count,
  headers,
  rows,
  footer,
}: {
  title: string;
  count: number;
  headers: string[];
  rows: string[][];
  footer?: string[];
}) {
  if (count === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold text-base">
        {title} ({count})
      </h3>
      <div className="border rounded-md overflow-auto max-h-96">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-left font-medium whitespace-nowrap border-b"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-b last:border-0">
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-3 py-1.5 whitespace-nowrap text-muted-foreground"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && (
            <tfoot className="bg-muted/30 sticky bottom-0">
              <tr>
                {footer.map((cell, i) => (
                  <td
                    key={i}
                    className="px-3 py-2 font-medium whitespace-nowrap border-t"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

export function ResultsDashboard({
  result,
  fileA,
  fileB,
  config,
  onNewReconciliation,
  onManualReconciliation,
  manualMatches,
  manualStep = "none",
  computeProgress,
}: ResultsDashboardProps) {
  const s = result.summary;
  const [isGenerating, setIsGenerating] = useState(false);
  const manualCount = manualMatches?.length ?? 0;
  const hasUnmatched = s.uniqueA > 0 && s.uniqueB > 0;
  const isDone = manualStep === "done" || !hasUnmatched;

  const handleDownload = useCallback(async () => {
    setIsGenerating(true);
    try {
      const blob = await generateReport(result, fileA, fileB, manualMatches);
      downloadBlob(blob);
    } finally {
      setIsGenerating(false);
    }
  }, [result, fileA, fileB, manualMatches]);

  // Variance table data
  const varianceHeaders = ["Clé", `Montant ${fileA.fileName}`, `Montant ${fileB.fileName}`, "Variance"];
  const varianceRows = result.amountVariances.map((v) => [
    v.key,
    formatAmount(v.amountA),
    formatAmount(v.amountB),
    formatAmount(v.variance),
  ]);
  const totalVariance = result.amountVariances.reduce((sum, v) => sum + v.variance, 0);
  const varianceFooter = ["Total", "", "", formatAmount(totalVariance)];

  // Unique A table
  const uniqueAHeaders = ["Clé", ...fileA.headers];
  const uniqueARows = result.uniqueA.map((u) => [u.key, ...u.row]);

  // Unique B table
  const uniqueBHeaders = ["Clé", ...fileB.headers];
  const uniqueBRows = result.uniqueB.map((u) => [u.key, ...u.row]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl">Résultats du rapprochement</h1>
          <div className="mt-2">
            <MatchRateIndicator rate={s.matchRate} />
          </div>
        </div>
        <Button onClick={handleDownload} disabled={isGenerating}>
          {isGenerating ? "Génération..." : "Télécharger le rapport Excel"}
        </Button>
      </div>

      {/* Summary cards */}
      <div className={`grid grid-cols-2 ${manualCount > 0 ? "md:grid-cols-5" : "md:grid-cols-4"} gap-4`}>
        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl text-green-600 text-center">
              {s.exactMatches}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">Correspondances exactes</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl text-orange-500 text-center">
              {s.amountVariances}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">Écarts de montant</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl text-red-500 text-center">
              {s.uniqueA}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">Uniques {baseName(fileA.fileName)}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl text-red-500 text-center">
              {s.uniqueB}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">Uniques {baseName(fileB.fileName)}</p>
          </CardContent>
        </Card>
        {manualCount > 0 && (
          <Card className="border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl text-green-600 text-center">
                {manualCount}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">Manuels</p>
            </CardContent>
          </Card>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {s.totalA} lignes {baseName(fileA.fileName)} · {s.totalB} lignes {baseName(fileB.fileName)}
        {s.duplicatesA + s.duplicatesB > 0 &&
          ` · ${s.duplicatesA + s.duplicatesB} doublons supprimés`}
      </p>

      {/* Manual reconciliation status */}
      {manualStep === "computing" && computeProgress && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            Calcul des suggestions... {computeProgress.current}/{computeProgress.total} lignes analysées
          </p>
          <div className="mt-2 h-2 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(computeProgress.current / computeProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {manualStep === "done" && manualCount > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700 font-medium">
            {manualCount} paire{manualCount !== 1 ? "s" : ""} rapprochée{manualCount !== 1 ? "s" : ""} manuellement
          </p>
        </div>
      )}

      {/* Manual reconciliation button */}
      {hasUnmatched && manualStep === "none" && (
        <Button
          variant="outline"
          onClick={onManualReconciliation}
          className="self-start"
        >
          Rapprochement manuel ({s.uniqueA + s.uniqueB} lignes non rapprochées)
        </Button>
      )}

      {/* Detail tables */}
      <DetailTable
        title="Écarts de montants"
        count={s.amountVariances}
        headers={varianceHeaders}
        rows={varianceRows}
        footer={varianceFooter}
      />

      <DetailTable
        title={`Lignes uniques ${baseName(fileA.fileName)}`}
        count={s.uniqueA}
        headers={uniqueAHeaders}
        rows={uniqueARows}
      />

      <DetailTable
        title={`Lignes uniques ${baseName(fileB.fileName)}`}
        count={s.uniqueB}
        headers={uniqueBHeaders}
        rows={uniqueBRows}
      />

      <div className="flex justify-start gap-3 pt-4">
        <Button variant="outline" onClick={onNewReconciliation}>
          Nouveau rapprochement
        </Button>
        <SaveTemplateDialog config={config} fileA={fileA} fileB={fileB} />
      </div>
    </div>
  );
}

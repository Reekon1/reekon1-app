"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { generateReport, downloadBlob } from "@/lib/reconciliation/report";
import type { ParsedFile, ReconciliationConfig, ReconciliationResult } from "@/lib/reconciliation/types";
import { SaveTemplateDialog } from "@/components/reconcile/save-template-dialog";

interface ResultsDashboardProps {
  result: ReconciliationResult;
  fileA: ParsedFile;
  fileB: ParsedFile;
  config: ReconciliationConfig;
  onNewReconciliation: () => void;
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
}: ResultsDashboardProps) {
  const s = result.summary;
  const [reportBlob, setReportBlob] = useState<Blob | null>(null);
  const autoDownloaded = useRef(false);

  // Generate report and auto-download
  useEffect(() => {
    generateReport(result, fileA, fileB).then((blob) => {
      setReportBlob(blob);
      if (!autoDownloaded.current) {
        autoDownloaded.current = true;
        downloadBlob(blob);
      }
    });
  }, [result, fileA, fileB]);

  const handleDownload = () => {
    if (reportBlob) downloadBlob(reportBlob);
  };

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
        <Button onClick={handleDownload} disabled={!reportBlob}>
          Télécharger le rapport Excel
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      </div>

      <p className="text-xs text-muted-foreground">
        {s.totalA} lignes {baseName(fileA.fileName)} · {s.totalB} lignes {baseName(fileB.fileName)}
        {s.duplicatesA + s.duplicatesB > 0 &&
          ` · ${s.duplicatesA + s.duplicatesB} doublons supprimés`}
      </p>

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

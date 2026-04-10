"use client";

import { DataPreviewUnified } from "@/components/reconcile/data-preview-unified";
import { Button } from "@/components/ui/button";
import type { RawParsedFile } from "@/lib/reconciliation/types";

interface ScopeStepProps {
  rawA: RawParsedFile;
  rawB: RawParsedFile;
  headerRowIndexA: number;
  headerRowIndexB: number;
  onHeaderRowChangeA: (index: number) => void;
  onHeaderRowChangeB: (index: number) => void;
  excludeFooterA: number;
  excludeFooterB: number;
  onExcludeFooterChangeA: (value: number) => void;
  onExcludeFooterChangeB: (value: number) => void;
  onBack: () => void;
  onNext: () => void;
}

export function ScopeStep({
  rawA,
  rawB,
  headerRowIndexA,
  headerRowIndexB,
  onHeaderRowChangeA,
  onHeaderRowChangeB,
  excludeFooterA,
  excludeFooterB,
  onExcludeFooterChangeA,
  onExcludeFooterChangeB,
  onBack,
  onNext,
}: ScopeStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Délimitez les lignes à traiter pour chaque fichier
      </p>

      <DataPreviewUnified
        raw={rawA}
        label={`Système A — ${rawA.fileName}`}
        headerRowIndex={headerRowIndexA}
        onHeaderRowChange={onHeaderRowChangeA}
        excludeFooter={excludeFooterA}
        onExcludeFooterChange={onExcludeFooterChangeA}
      />

      <DataPreviewUnified
        raw={rawB}
        label={`Système B — ${rawB.fileName}`}
        headerRowIndex={headerRowIndexB}
        onHeaderRowChange={onHeaderRowChangeB}
        excludeFooter={excludeFooterB}
        onExcludeFooterChange={onExcludeFooterChangeB}
      />

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Retour
        </Button>
        <Button onClick={onNext}>
          Continuer
        </Button>
      </div>
    </div>
  );
}

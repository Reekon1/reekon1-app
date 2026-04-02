"use client";

import { DataPreview } from "@/components/reconcile/data-preview";
import { DataPreviewFooter } from "@/components/reconcile/data-preview-footer";
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

function baseName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "");
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
        Sélectionnez la première et la dernière ligne à traiter pour chaque fichier
      </p>

      {/* Header row selection */}
      <div className="flex flex-col gap-6">
        <DataPreview
          raw={rawA}
          label={`Système A — ${rawA.fileName}`}
          headerRowIndex={headerRowIndexA}
          onHeaderRowChange={onHeaderRowChangeA}
        />
        <DataPreview
          raw={rawB}
          label={`Système B — ${rawB.fileName}`}
          headerRowIndex={headerRowIndexB}
          onHeaderRowChange={onHeaderRowChangeB}
        />
      </div>

      {/* Footer exclusions — visual click-to-jump like header */}
      <div className="flex flex-col gap-6">
        <DataPreviewFooter
          raw={rawA}
          label={`Pied de page — ${rawA.fileName}`}
          headerRowIndex={headerRowIndexA}
          excludeFooter={excludeFooterA}
          onExcludeFooterChange={onExcludeFooterChangeA}
        />
        <DataPreviewFooter
          raw={rawB}
          label={`Pied de page — ${rawB.fileName}`}
          headerRowIndex={headerRowIndexB}
          excludeFooter={excludeFooterB}
          onExcludeFooterChange={onExcludeFooterChangeB}
        />
      </div>

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

"use client";

import { useState, useCallback, useMemo, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Stepper } from "@/components/reconcile/stepper";
import { UploadStep } from "@/components/reconcile/upload-step";
import { ScopeStep } from "@/components/reconcile/scope-step";
import { ConfigurationStep, type ConfigurationConfig } from "@/components/reconcile/configuration-step";
import { ResultsDashboard } from "@/components/reconcile/results-dashboard";
import { ManualReconciliationModal } from "@/components/reconcile/manual-reconciliation-modal";
import { parseFile } from "@/lib/reconciliation/parser";
import { reconcile } from "@/lib/reconciliation/engine";
import { getTemplate } from "@/lib/actions/templates";
import { fromTemplateConfig } from "@/lib/types/template";
import type { TemplateConfig } from "@/lib/types/template";
import {
  toParsedFile,
  type RawParsedFile,
  type ReconciliationConfig,
  type ReconciliationResult,
  type UniqueRow,
  type ManualMatch,
} from "@/lib/reconciliation/types";

const STEPS = [
  { label: "Upload", description: "Importer les fichiers" },
  { label: "Scope", description: "En-têtes et pieds de page" },
  { label: "Configuration", description: "Clés et montants" },
];

interface FileState {
  file: File | null;
  raw: RawParsedFile | null;
  headerRowIndex: number;
  error: string | null;
  isLoading: boolean;
}

const initialFileState: FileState = {
  file: null,
  raw: null,
  headerRowIndex: 0,
  error: null,
  isLoading: false,
};

function ReconcilePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");

  // Step management
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // File state
  const [fileA, setFileA] = useState<FileState>(initialFileState);
  const [fileB, setFileB] = useState<FileState>(initialFileState);

  // Scope state
  const [excludeFooterA, setExcludeFooterA] = useState(0);
  const [excludeFooterB, setExcludeFooterB] = useState(0);
  const [deduplication, setDeduplication] = useState(false);

  // Reconciliation state
  const [isReconciling, setIsReconciling] = useState(false);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [lastConfig, setLastConfig] = useState<ReconciliationConfig | null>(null);
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig | null>(null);

  // Manual reconciliation state
  const [manualMatches, setManualMatches] = useState<ManualMatch[]>([]);
  const [manualModalOpen, setManualModalOpen] = useState(false);

  const resetToConfigurationStep = useCallback(() => {
    setShowResults(false);
    setCurrentStep(2);
    setManualMatches([]);
    setManualModalOpen(false);
  }, []);

  const handleBackToConfiguration = useCallback(() => {
    if (showResults && window.history.state?.results) {
      window.history.back();
      return;
    }

    resetToConfigurationStep();
  }, [showResults, resetToConfigurationStep]);

  // Browser back button: return to configuration from results
  useEffect(() => {
    const onPopState = () => {
      if (showResults) {
        resetToConfigurationStep();
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [showResults, resetToConfigurationStep]);

  // Track headers to detect changes and reset columns config
  const prevHeadersRef = useRef<string>("");

  // Load template if query param present
  useEffect(() => {
    if (templateId) {
      getTemplate(templateId).then((res) => {
        if (res.success && res.data) {
          setTemplateConfig(res.data.config);
        }
      });
    }
  }, [templateId]);

  const parsedA = useMemo(
    () => (fileA.raw ? toParsedFile(fileA.raw, fileA.headerRowIndex) : null),
    [fileA.raw, fileA.headerRowIndex]
  );
  const parsedB = useMemo(
    () => (fileB.raw ? toParsedFile(fileB.raw, fileB.headerRowIndex) : null),
    [fileB.raw, fileB.headerRowIndex]
  );

  // Compute initial config from template when files are parsed
  const appliedTemplate = useMemo(() => {
    if (!templateConfig || !parsedA || !parsedB) return null;
    return fromTemplateConfig(templateConfig, parsedA.headers, parsedB.headers);
  }, [templateConfig, parsedA, parsedB]);

  const configurationInitialState = lastConfig ?? appliedTemplate?.config;
  const configurationWarnings = lastConfig ? undefined : appliedTemplate?.warnings;

  // Apply template scope values
  useEffect(() => {
    if (appliedTemplate) {
      setExcludeFooterA(appliedTemplate.config.excludeFooterRowsA);
      setExcludeFooterB(appliedTemplate.config.excludeFooterRowsB);
      setDeduplication(appliedTemplate.config.deduplication);
    }
  }, [appliedTemplate]);

  // Track header changes — reset columns step key when headers change
  const [columnsKey, setColumnsKey] = useState(0);
  useEffect(() => {
    if (parsedA && parsedB) {
      const headersSignature = parsedA.headers.join("\0") + "||" + parsedB.headers.join("\0");
      if (prevHeadersRef.current && prevHeadersRef.current !== headersSignature) {
        setColumnsKey((k) => k + 1);
      }
      prevHeadersRef.current = headersSignature;
    }
  }, [parsedA, parsedB]);

  const handleFileSelect = useCallback(
    async (key: "A" | "B", file: File, sheetName?: string) => {
      const setter = key === "A" ? setFileA : setFileB;
      setter({ file, raw: null, headerRowIndex: 0, error: null, isLoading: true });

      try {
        const raw = await parseFile(file, sheetName);
        setter({ file, raw, headerRowIndex: 0, error: null, isLoading: false });
      } catch (err) {
        setter({
          file,
          raw: null,
          headerRowIndex: 0,
          error:
            err instanceof Error
              ? err.message
              : "Impossible de lire le fichier. Vérifiez le format.",
          isLoading: false,
        });
      }
    },
    []
  );

  const handleSheetSelect = useCallback(
    async (key: "A" | "B", sheetName: string) => {
      const fileState = key === "A" ? fileA : fileB;
      if (!fileState.file) return;
      await handleFileSelect(key, fileState.file, sheetName);
    },
    [fileA, fileB, handleFileSelect]
  );

  const handleFileRemove = useCallback((key: "A" | "B") => {
    const setter = key === "A" ? setFileA : setFileB;
    setter(initialFileState);
    setCurrentStep(0);
    setExcludeFooterA(0);
    setExcludeFooterB(0);
    setDeduplication(false);
  }, []);

  const handleReconcile = useCallback(
    async (columnsConfig: ConfigurationConfig) => {
      if (!parsedA || !parsedB) return;

      const config: ReconciliationConfig = {
        ...columnsConfig,
        excludeHeaderRowsA: 0,
        excludeHeaderRowsB: 0,
        excludeFooterRowsA: excludeFooterA,
        excludeFooterRowsB: excludeFooterB,
        deduplication,
      };

      setIsReconciling(true);
      try {
        await new Promise((r) => setTimeout(r, 0));
        const res = reconcile(parsedA, parsedB, config);
        setResult(res);
        setLastConfig(config);
        setShowResults(true);
        window.history.pushState({ results: true }, "");
        // Reset manual reconciliation state
        setManualMatches([]);
        setManualModalOpen(false);
      } catch (err) {
        console.error("Reconciliation error:", err);
      } finally {
        setIsReconciling(false);
      }
    },
    [parsedA, parsedB, excludeFooterA, excludeFooterB, deduplication]
  );

  // Unique rows excluding those already matched manually, along with the
  // original-index mapping so confirmed matches can be persisted consistently
  // across multiple passes.
  const remaining = useMemo(() => {
    if (!result) {
      return {
        a: [] as UniqueRow[],
        b: [] as UniqueRow[],
        origA: [] as number[],
        origB: [] as number[],
      };
    }
    const usedA = new Set(manualMatches.map((m) => m.indexA));
    const usedB = new Set(manualMatches.map((m) => m.indexB));
    const a: UniqueRow[] = [];
    const b: UniqueRow[] = [];
    const origA: number[] = [];
    const origB: number[] = [];
    result.uniqueA.forEach((u, i) => {
      if (!usedA.has(i)) {
        a.push(u);
        origA.push(i);
      }
    });
    result.uniqueB.forEach((u, i) => {
      if (!usedB.has(i)) {
        b.push(u);
        origB.push(i);
      }
    });
    return { a, b, origA, origB };
  }, [result, manualMatches]);

  const handleOpenManualModal = useCallback(() => {
    if (!result) return;
    setManualModalOpen(true);
  }, [result]);

  const handleManualConfirmed = useCallback((newMatches: ManualMatch[]) => {
    setManualMatches((prev) => [...prev, ...newMatches]);
  }, []);

  const handleNewReconciliation = useCallback(() => {
    setResult(null);
    setLastConfig(null);
    setTemplateConfig(null);
    setFileA(initialFileState);
    setFileB(initialFileState);
    setCurrentStep(0);
    setShowResults(false);
    setExcludeFooterA(0);
    setExcludeFooterB(0);
    setDeduplication(false);
    setManualMatches([]);
    setManualModalOpen(false);
    if (templateId) {
      router.replace("/protected/reconcile");
    }
  }, [templateId, router]);

  // --- Results: full page, no stepper ---
  if (showResults && result && parsedA && parsedB && lastConfig) {
    return (
      <div className="flex-1 w-full flex flex-col gap-8 max-w-5xl mx-auto p-5">
        <ResultsDashboard
          result={result}
          fileA={parsedA}
          fileB={parsedB}
          config={lastConfig}
          onNewReconciliation={handleNewReconciliation}
          onBackToConfiguration={handleBackToConfiguration}
          onManualReconciliation={handleOpenManualModal}
          manualMatches={manualMatches.length > 0 ? manualMatches : undefined}
          remainingUniqueA={remaining.a.length}
          remainingUniqueB={remaining.b.length}
        />

        <ManualReconciliationModal
          open={manualModalOpen}
          onOpenChange={setManualModalOpen}
          headersA={parsedA.headers}
          headersB={parsedB.headers}
          fileAName={parsedA.fileName}
          fileBName={parsedB.fileName}
          remainingA={remaining.a}
          remainingB={remaining.b}
          remainingOriginalIndexA={remaining.origA}
          remainingOriginalIndexB={remaining.origB}
          onConfirm={handleManualConfirmed}
        />
      </div>
    );
  }

  // --- Stepper layout ---
  const stepContent = (() => {
    switch (currentStep) {
      case 0:
        return (
          <UploadStep
            fileA={fileA}
            fileB={fileB}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            onNext={() => setCurrentStep(1)}
            hasTemplate={!!templateConfig}
            onSheetSelect={handleSheetSelect}
          />
        );
      case 1:
        if (!fileA.raw || !fileB.raw) return null;
        return (
          <ScopeStep
            rawA={fileA.raw}
            rawB={fileB.raw}
            headerRowIndexA={fileA.headerRowIndex}
            headerRowIndexB={fileB.headerRowIndex}
            onHeaderRowChangeA={(i) =>
              setFileA((prev) => ({ ...prev, headerRowIndex: i }))
            }
            onHeaderRowChangeB={(i) =>
              setFileB((prev) => ({ ...prev, headerRowIndex: i }))
            }
            excludeFooterA={excludeFooterA}
            excludeFooterB={excludeFooterB}
            onExcludeFooterChangeA={setExcludeFooterA}
            onExcludeFooterChangeB={setExcludeFooterB}
            onBack={() => setCurrentStep(0)}
            onNext={() => setCurrentStep(2)}
          />
        );
      case 2:
        if (!parsedA || !parsedB) return null;
        return (
          <ConfigurationStep
            key={`${templateId ?? "default"}-${columnsKey}`}
            fileA={parsedA}
            fileB={parsedB}
            onSubmit={handleReconcile}
            onBack={() => setCurrentStep(1)}
            isLoading={isReconciling}
            deduplication={deduplication}
            onDeduplicationChange={setDeduplication}
            initialConfig={configurationInitialState}
            warnings={configurationWarnings}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <div className="flex-1 w-full flex flex-col gap-6 max-w-6xl mx-auto p-5">
      <h1 className="font-bold text-2xl">Nouveau rapprochement</h1>

      <div className="flex gap-8">
        <Stepper
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={(i) => setCurrentStep(i)}
        />
        <div className="flex-1 min-w-0">{stepContent}</div>
      </div>
    </div>
  );
}

export default function ReconcilePage() {
  return (
    <Suspense>
      <ReconcilePageInner />
    </Suspense>
  );
}

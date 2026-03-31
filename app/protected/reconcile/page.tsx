"use client";

import { useState, useCallback, useMemo, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Stepper } from "@/components/reconcile/stepper";
import { UploadStep } from "@/components/reconcile/upload-step";
import { ScopeStep } from "@/components/reconcile/scope-step";
import { ConfigurationStep, type ConfigurationConfig } from "@/components/reconcile/configuration-step";
import { ResultsDashboard } from "@/components/reconcile/results-dashboard";
import { ManualReconciliation } from "@/components/reconcile/manual-reconciliation";
import { parseFile } from "@/lib/reconciliation/parser";
import { reconcile } from "@/lib/reconciliation/engine";
import { getTemplate } from "@/lib/actions/templates";
import { fromTemplateConfig } from "@/lib/types/template";
import { computeSuggestionsAsync, type SimilaritySuggestion } from "@/lib/reconciliation/similarity";
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
  const [manualStep, setManualStep] = useState<"none" | "computing" | "selecting" | "done">("none");
  const [suggestions, setSuggestions] = useState<SimilaritySuggestion[]>([]);
  const [manualMatches, setManualMatches] = useState<ManualMatch[]>([]);
  const [capturedUniqueA, setCapturedUniqueA] = useState<UniqueRow[]>([]);
  const [capturedUniqueB, setCapturedUniqueB] = useState<UniqueRow[]>([]);
  const [computeProgress, setComputeProgress] = useState({ current: 0, total: 0 });

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
        // Reset manual reconciliation state
        setManualStep("none");
        setSuggestions([]);
        setManualMatches([]);
      } catch (err) {
        console.error("Reconciliation error:", err);
      } finally {
        setIsReconciling(false);
      }
    },
    [parsedA, parsedB, excludeFooterA, excludeFooterB, deduplication]
  );

  const handleStartManualReconciliation = useCallback(async () => {
    if (!result) return;

    // Capture unique rows at this moment (stale reference guard)
    const captA = [...result.uniqueA];
    const captB = [...result.uniqueB];
    setCapturedUniqueA(captA);
    setCapturedUniqueB(captB);

    setManualStep("computing");
    setComputeProgress({ current: 0, total: captA.length });

    const sug = await computeSuggestionsAsync(
      captA,
      captB,
      (current, total) => setComputeProgress({ current, total }),
    );

    setSuggestions(sug);
    setManualStep("selecting");
  }, [result]);

  const handleManualConfirm = useCallback(
    (selectedPairs: SimilaritySuggestion[]) => {
      const matches: ManualMatch[] = selectedPairs.map((s) => ({
        keyA: s.keyA,
        keyB: s.keyB,
        rowA: capturedUniqueA[s.indexA]?.row ?? [],
        rowB: capturedUniqueB[s.indexB]?.row ?? [],
        similarity: s.similarity,
      }));
      setManualMatches(matches);
      setManualStep("done");
    },
    [capturedUniqueA, capturedUniqueB]
  );

  const handleManualSkip = useCallback(() => {
    setManualStep("done");
    setManualMatches([]);
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
    setManualStep("none");
    setSuggestions([]);
    setManualMatches([]);
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
          onManualReconciliation={handleStartManualReconciliation}
          manualMatches={manualMatches.length > 0 ? manualMatches : undefined}
          manualStep={manualStep}
          computeProgress={computeProgress}
        />

        {manualStep === "selecting" && (
          <ManualReconciliation
            suggestions={suggestions}
            uniqueA={capturedUniqueA}
            uniqueB={capturedUniqueB}
            onConfirm={handleManualConfirm}
            onSkip={handleManualSkip}
          />
        )}
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
            initialConfig={appliedTemplate?.config}
            warnings={appliedTemplate?.warnings}
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

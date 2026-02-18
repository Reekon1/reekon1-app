"use client";

import { useState, useCallback, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FileUploader } from "@/components/reconcile/file-uploader";
import { DataPreview } from "@/components/reconcile/data-preview";
import { ConfigureStep } from "@/components/reconcile/configure-step";
import { ResultsDashboard } from "@/components/reconcile/results-dashboard";
import { Button } from "@/components/ui/button";
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
} from "@/lib/reconciliation/types";

type Step = "upload" | "configure" | "results";

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

  const [step, setStep] = useState<Step>("upload");
  const [fileA, setFileA] = useState<FileState>(initialFileState);
  const [fileB, setFileB] = useState<FileState>(initialFileState);
  const [isReconciling, setIsReconciling] = useState(false);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [lastConfig, setLastConfig] = useState<ReconciliationConfig | null>(null);
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig | null>(null);

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

  const handleFileSelect = useCallback(
    async (key: "A" | "B", file: File) => {
      const setter = key === "A" ? setFileA : setFileB;
      setter({ file, raw: null, headerRowIndex: 0, error: null, isLoading: true });

      try {
        const raw = await parseFile(file);
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

  const handleFileRemove = useCallback((key: "A" | "B") => {
    const setter = key === "A" ? setFileA : setFileB;
    setter(initialFileState);
  }, []);

  const handleReconcile = useCallback(
    async (config: ReconciliationConfig) => {
      if (!parsedA || !parsedB) return;

      setIsReconciling(true);
      try {
        await new Promise((r) => setTimeout(r, 0));
        const res = reconcile(parsedA, parsedB, config);
        setResult(res);
        setLastConfig(config);
        setStep("results");
      } catch (err) {
        console.error("Reconciliation error:", err);
      } finally {
        setIsReconciling(false);
      }
    },
    [parsedA, parsedB]
  );

  const bothParsed = parsedA && parsedB;
  const isLoading = fileA.isLoading || fileB.isLoading;

  // --- Configure step ---
  if (step === "configure" && parsedA && parsedB) {
    return (
      <div className="flex-1 w-full flex flex-col gap-8 max-w-5xl mx-auto p-5">
        <ConfigureStep
          key={templateId ?? "default"}
          fileA={parsedA}
          fileB={parsedB}
          onSubmit={handleReconcile}
          onBack={() => setStep("upload")}
          isLoading={isReconciling}
          initialConfig={appliedTemplate?.config}
          warnings={appliedTemplate?.warnings}
        />
      </div>
    );
  }

  // --- Results step ---
  if (step === "results" && result && parsedA && parsedB && lastConfig) {
    return (
      <div className="flex-1 w-full flex flex-col gap-8 max-w-5xl mx-auto p-5">
        <ResultsDashboard
          result={result}
          fileA={parsedA}
          fileB={parsedB}
          config={lastConfig}
          onNewReconciliation={() => {
            setResult(null);
            setLastConfig(null);
            setTemplateConfig(null);
            setFileA(initialFileState);
            setFileB(initialFileState);
            setStep("upload");
            if (templateId) {
              router.replace("/protected/reconcile");
            }
          }}
        />
      </div>
    );
  }

  // --- Upload step ---
  return (
    <div className="flex-1 w-full flex flex-col gap-8 max-w-5xl mx-auto p-5">
      <div>
        <h1 className="font-bold text-2xl">Nouveau rapprochement</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {templateConfig
            ? "Importez vos fichiers — la configuration du modèle sera appliquée automatiquement"
            : "Importez vos deux fichiers pour commencer le rapprochement"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FileUploader
          label="Fichier Système A"
          file={fileA.file}
          onFileSelect={(f) => handleFileSelect("A", f)}
          onFileRemove={() => handleFileRemove("A")}
          error={fileA.error}
          isLoading={fileA.isLoading}
        />
        <FileUploader
          label="Fichier Système B"
          file={fileB.file}
          onFileSelect={(f) => handleFileSelect("B", f)}
          onFileRemove={() => handleFileRemove("B")}
          error={fileB.error}
          isLoading={fileB.isLoading}
        />
      </div>

      {(fileA.raw || fileB.raw) && (
        <div className="flex flex-col gap-6">
          <h2 className="font-semibold text-lg">Prévisualisation</h2>
          {fileA.raw && (
            <DataPreview
              raw={fileA.raw}
              label={`Système A — ${fileA.raw.fileName}`}
              headerRowIndex={fileA.headerRowIndex}
              onHeaderRowChange={(i) =>
                setFileA((prev) => ({ ...prev, headerRowIndex: i }))
              }
            />
          )}
          {fileB.raw && (
            <DataPreview
              raw={fileB.raw}
              label={`Système B — ${fileB.raw.fileName}`}
              headerRowIndex={fileB.headerRowIndex}
              onHeaderRowChange={(i) =>
                setFileB((prev) => ({ ...prev, headerRowIndex: i }))
              }
            />
          )}
        </div>
      )}

      {bothParsed && (
        <div className="flex justify-end">
          <Button onClick={() => setStep("configure")} disabled={isLoading}>
            Continuer
          </Button>
        </div>
      )}
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

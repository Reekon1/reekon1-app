"use client";

import { FileUploader } from "@/components/reconcile/file-uploader";
import { Button } from "@/components/ui/button";
import type { RawParsedFile } from "@/lib/reconciliation/types";

interface FileState {
  file: File | null;
  raw: RawParsedFile | null;
  headerRowIndex: number;
  error: string | null;
  isLoading: boolean;
}

interface UploadStepProps {
  fileA: FileState;
  fileB: FileState;
  onFileSelect: (key: "A" | "B", file: File) => void;
  onFileRemove: (key: "A" | "B") => void;
  onNext: () => void;
  hasTemplate: boolean;
}

export function UploadStep({
  fileA,
  fileB,
  onFileSelect,
  onFileRemove,
  onNext,
  hasTemplate,
}: UploadStepProps) {
  const bothParsed = fileA.raw && fileB.raw;
  const isLoading = fileA.isLoading || fileB.isLoading;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        {hasTemplate
          ? "Importez vos fichiers — la configuration du modèle sera appliquée automatiquement"
          : "Importez vos deux fichiers pour commencer le rapprochement"}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FileUploader
          label="Fichier Système A"
          file={fileA.file}
          onFileSelect={(f) => onFileSelect("A", f)}
          onFileRemove={() => onFileRemove("A")}
          error={fileA.error}
          isLoading={fileA.isLoading}
        />
        <FileUploader
          label="Fichier Système B"
          file={fileB.file}
          onFileSelect={(f) => onFileSelect("B", f)}
          onFileRemove={() => onFileRemove("B")}
          error={fileB.error}
          isLoading={fileB.isLoading}
        />
      </div>

      {bothParsed && (
        <div className="flex justify-end">
          <Button onClick={onNext} disabled={isLoading}>
            Continuer
          </Button>
        </div>
      )}
    </div>
  );
}

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
  onSheetSelect?: (key: "A" | "B", sheetName: string) => void;
}

function FileMetaBadge({ raw }: { raw: RawParsedFile }) {
  const rowCount = raw.rawRows.length.toLocaleString("fr-FR");
  const encoding = raw.detectedEncoding?.toUpperCase() ?? "";
  return (
    <p className="text-xs text-muted-foreground mt-1">
      {rowCount} lignes{encoding ? ` · ${encoding}` : ""}
    </p>
  );
}

function SheetSelector({
  sheetNames,
  selectedSheet,
  onSelect,
}: {
  sheetNames: string[];
  selectedSheet?: string;
  onSelect: (name: string) => void;
}) {
  return (
    <div className="mt-2">
      <label className="text-xs text-muted-foreground block mb-1">Onglet :</label>
      <select
        className="text-sm border rounded px-2 py-1 w-full"
        value={selectedSheet ?? sheetNames[0]}
        onChange={(e) => onSelect(e.target.value)}
      >
        {sheetNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}

function ParseWarnings({ raw }: { raw: RawParsedFile }) {
  if (!raw.warnings || raw.warnings.length === 0) return null;
  return (
    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
      {raw.warnings.map((w, i) => (
        <p key={i} className="text-sm text-amber-700">
          {w.message}
        </p>
      ))}
    </div>
  );
}

export function UploadStep({
  fileA,
  fileB,
  onFileSelect,
  onFileRemove,
  onNext,
  hasTemplate,
  onSheetSelect,
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
        <div>
          <FileUploader
            label="Fichier Système A"
            file={fileA.file}
            onFileSelect={(f) => onFileSelect("A", f)}
            onFileRemove={() => onFileRemove("A")}
            error={fileA.error}
            isLoading={fileA.isLoading}
          />
          {fileA.raw && <FileMetaBadge raw={fileA.raw} />}
          {fileA.raw?.sheetNames && onSheetSelect && (
            <SheetSelector
              sheetNames={fileA.raw.sheetNames}
              onSelect={(name) => onSheetSelect("A", name)}
            />
          )}
          {fileA.raw && <ParseWarnings raw={fileA.raw} />}
        </div>
        <div>
          <FileUploader
            label="Fichier Système B"
            file={fileB.file}
            onFileSelect={(f) => onFileSelect("B", f)}
            onFileRemove={() => onFileRemove("B")}
            error={fileB.error}
            isLoading={fileB.isLoading}
          />
          {fileB.raw && <FileMetaBadge raw={fileB.raw} />}
          {fileB.raw?.sheetNames && onSheetSelect && (
            <SheetSelector
              sheetNames={fileB.raw.sheetNames}
              onSelect={(name) => onSheetSelect("B", name)}
            />
          )}
          {fileB.raw && <ParseWarnings raw={fileB.raw} />}
        </div>
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

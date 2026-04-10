"use client";

import { useState } from "react";
import { FileUploader } from "@/components/reconcile/file-uploader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { RawParsedFile, RowIssue, ExcerptSegment } from "@/lib/reconciliation/types";

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

function Excerpt({ segments }: { segments: ExcerptSegment[] }) {
  return (
    <>
      {segments.map((seg, i) =>
        seg.highlight ? (
          <mark
            key={i}
            className="bg-red-200 text-red-800 rounded-sm px-0.5 font-bold"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

function hasHighlight(segments: ExcerptSegment[]): boolean {
  return segments.some((s) => s.highlight);
}

function IssuesModal({
  issues,
  onClose,
}: {
  issues: RowIssue[] | null;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<RowIssue | null>(null);

  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  return (
    <Dialog open={issues !== null} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="!max-w-[calc(100vw-4rem)] w-full max-h-[90vh] flex flex-col">
        {issues && !selected && (
          <>
            <DialogHeader>
              <DialogTitle>
                {issues.length} ligne(s) avec erreur(s) de format
              </DialogTitle>
              <DialogDescription>
                Cliquez sur une ligne pour voir le détail du problème
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-auto min-h-0">
              <table className="text-xs w-full">
                <thead>
                  <tr className="text-left bg-muted/50">
                    <th className="py-1.5 px-2 font-semibold">Ligne</th>
                    <th className="py-1.5 px-2 font-semibold">Problème</th>
                    <th className="py-1.5 px-2 font-semibold">Colonnes</th>
                    <th className="py-1.5 px-2 font-semibold">Extrait</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.slice(0, 100).map((issue) => {
                    const plainText = issue.excerpt.map((s) => s.text).join("");
                    return (
                      <tr
                        key={issue.line}
                        className="border-t cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => setSelected(issue)}
                      >
                        <td className="py-1.5 px-2 font-mono whitespace-nowrap">
                          {issue.line.toLocaleString("fr-FR")}
                        </td>
                        <td className="py-1.5 px-2">
                          {issue.diagnoses.map((d) => d.label).join(", ")}
                        </td>
                        <td className="py-1.5 px-2 font-mono whitespace-nowrap">
                          {issue.columnCount != null && issue.expectedColumns != null
                            ? `${issue.columnCount} / ${issue.expectedColumns}`
                            : "—"}
                        </td>
                        <td className="py-1.5 px-2 max-w-[400px] truncate" title={plainText}>
                          <code className="text-[11px]">
                            <Excerpt segments={issue.excerpt} />
                          </code>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {issues.length > 100 && (
                <p className="text-xs text-muted-foreground p-2">
                  … et {(issues.length - 100).toLocaleString("fr-FR")} autres lignes
                </p>
              )}
            </div>
          </>
        )}

        {selected && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <button
                  onClick={() => setSelected(null)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Retour
                </button>
                <span>Ligne {selected.line.toLocaleString("fr-FR")}</span>
              </DialogTitle>
              <DialogDescription>
                {selected.diagnoses.map((d) => d.label).join(", ")}
                {selected.columnCount != null &&
                  selected.expectedColumns != null &&
                  ` — ${selected.columnCount} colonnes au lieu de ${selected.expectedColumns}`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              {selected.diagnoses.map((d, i) => (
                <div
                  key={i}
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm space-y-1"
                >
                  <p className="font-medium text-red-800">{d.label}</p>
                  <p className="text-red-700">{d.explanation}</p>
                  <p className="text-red-900 font-medium">
                    💡 {d.fix}
                  </p>
                </div>
              ))}
            </div>

            <div className="overflow-auto min-h-0 border rounded-md">
              <table className="text-xs">
                <thead>
                  <tr>
                    {selected.fields.map((field, idx) => {
                      const flagged = field.isExtra || hasHighlight(field.value);
                      return (
                        <th
                          key={idx}
                          className={`py-1.5 px-2 font-semibold text-left whitespace-nowrap border-b border-r border-border last:border-r-0 ${
                            flagged
                              ? "bg-red-100 text-red-800"
                              : "bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          {field.header}
                          {field.isExtra && (
                            <span className="ml-1 text-[10px] font-semibold text-red-600 bg-red-200 rounded px-1 py-0.5">
                              +
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {selected.fields.map((field, idx) => {
                      const flagged = field.isExtra || hasHighlight(field.value);
                      return (
                        <td
                          key={idx}
                          className={`py-1.5 px-2 align-top border-r border-border last:border-r-0 whitespace-nowrap ${
                            flagged ? "bg-red-50" : ""
                          }`}
                        >
                          <code>
                            <Excerpt segments={field.value} />
                          </code>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ParseWarnings({ raw }: { raw: RawParsedFile }) {
  const [openIssues, setOpenIssues] = useState<RowIssue[] | null>(null);

  if (!raw.warnings || raw.warnings.length === 0) return null;
  return (
    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md space-y-1">
      {raw.warnings.map((w, i) => (
        <div key={i}>
          <p className="text-sm text-amber-700">{w.message}</p>
          {w.rowIssues && w.rowIssues.length > 0 && (
            <button
              className="mt-1 text-xs text-amber-600 hover:underline cursor-pointer"
              onClick={() => setOpenIssues(w.rowIssues!)}
            >
              Voir les {w.rowIssues.length} ligne(s) affectée(s)
            </button>
          )}
        </div>
      ))}
      <IssuesModal
        issues={openIssues}
        onClose={() => setOpenIssues(null)}
      />
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

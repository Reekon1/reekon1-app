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

function RowIssueRow({
  issue,
  onSelect,
}: {
  issue: RowIssue;
  onSelect: (issue: RowIssue) => void;
}) {
  const plainText = issue.excerpt.map((s) => s.text).join("");
  return (
    <tr
      className="border-t border-amber-200 cursor-pointer hover:bg-amber-100/60 transition-colors"
      onClick={() => onSelect(issue)}
    >
      <td className="py-1 pr-2 font-mono whitespace-nowrap align-top">
        {issue.line.toLocaleString("fr-FR")}
      </td>
      <td className="py-1 pr-2 align-top">
        {issue.diagnoses.map((d) => d.label).join(", ")}
      </td>
      <td className="py-1 pr-2 font-mono whitespace-nowrap align-top">
        {issue.columnCount != null && issue.expectedColumns != null
          ? `${issue.columnCount} / ${issue.expectedColumns}`
          : "—"}
      </td>
      <td className="py-1 align-top max-w-[300px] truncate" title={plainText}>
        <code className="text-[11px]">
          <Excerpt segments={issue.excerpt} />
        </code>
      </td>
    </tr>
  );
}

function hasHighlight(segments: ExcerptSegment[]): boolean {
  return segments.some((s) => s.highlight);
}

function RowIssueModal({
  issue,
  onClose,
}: {
  issue: RowIssue | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={issue !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100vw-2rem)] w-fit max-h-[90vh] flex flex-col">
        {issue && (
          <>
            <DialogHeader>
              <DialogTitle>
                Ligne {issue.line.toLocaleString("fr-FR")}
              </DialogTitle>
              <DialogDescription>
                {issue.diagnoses.map((d) => d.label).join(", ")}
                {issue.columnCount != null &&
                  issue.expectedColumns != null &&
                  ` — ${issue.columnCount} colonnes au lieu de ${issue.expectedColumns}`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              {issue.diagnoses.map((d, i) => (
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
                    {issue.fields.map((field, idx) => {
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
                    {issue.fields.map((field, idx) => {
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
  const [selectedIssue, setSelectedIssue] = useState<RowIssue | null>(null);

  if (!raw.warnings || raw.warnings.length === 0) return null;
  return (
    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md space-y-1">
      {raw.warnings.map((w, i) => (
        <div key={i}>
          <p className="text-sm text-amber-700">{w.message}</p>
          {w.rowIssues && w.rowIssues.length > 0 && (
            <details className="mt-1">
              <summary className="text-xs text-amber-600 cursor-pointer hover:underline">
                Voir le détail des {w.rowIssues.length} ligne(s) affectée(s)
              </summary>
              <div className="mt-1 overflow-x-auto">
                <table className="text-xs text-amber-700 w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="py-1 pr-2 font-semibold">Ligne</th>
                      <th className="py-1 pr-2 font-semibold">Problème</th>
                      <th className="py-1 pr-2 font-semibold">Colonnes</th>
                      <th className="py-1 font-semibold">Extrait</th>
                    </tr>
                  </thead>
                  <tbody>
                    {w.rowIssues.slice(0, 50).map((issue) => (
                      <RowIssueRow
                        key={issue.line}
                        issue={issue}
                        onSelect={setSelectedIssue}
                      />
                    ))}
                  </tbody>
                </table>
                {w.rowIssues.length > 50 && (
                  <p className="text-xs text-amber-600 mt-1">
                    … et {(w.rowIssues.length - 50).toLocaleString("fr-FR")} autres lignes
                  </p>
                )}
              </div>
            </details>
          )}
        </div>
      ))}
      <RowIssueModal
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
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

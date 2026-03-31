"use client";

import { useCallback, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { validateFile } from "@/lib/reconciliation/parser";

interface FileUploaderProps {
  label: string;
  file: File | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  error?: string | null;
  isLoading?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getExtLabel(name: string): string {
  return name.slice(name.lastIndexOf(".") + 1).toUpperCase();
}

export function FileUploader({
  label,
  file,
  onFileSelect,
  onFileRemove,
  error,
  isLoading,
}: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (f: File) => {
      setValidationError(null);
      const err = validateFile(f);
      if (err) {
        setValidationError(err);
        return;
      }
      onFileSelect(f);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
      e.target.value = "";
    },
    [handleFile]
  );

  const displayError = validationError || error;

  if (file) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{label}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="truncate max-w-48">{file.name}</span>
                <span>·</span>
                <span>{getExtLabel(file.name)}</span>
                <span>·</span>
                <span>{formatSize(file.size)}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onFileRemove}
              disabled={isLoading}
            >
              ✕
            </Button>
          </div>
          {displayError && (
            <p className="mt-2 text-sm text-red-500">{displayError}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card
        className={`cursor-pointer transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-dashed hover:border-primary/50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <CardContent className="p-8 text-center">
          <p className="text-sm font-medium mb-1">{label}</p>
          <p className="text-sm text-muted-foreground">
            Glissez un fichier ici ou cliquez pour parcourir
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            xlsx, xls, csv, txt — 50 Mo max
          </p>
        </CardContent>
      </Card>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv,.txt"
        className="hidden"
        onChange={handleInputChange}
      />
      {displayError && (
        <p className="mt-2 text-sm text-red-500">{displayError}</p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveTemplate, upsertTemplate } from "@/lib/actions/templates";
import { toTemplateConfig } from "@/lib/types/template";
import type { ReconciliationConfig, ParsedFile } from "@/lib/reconciliation/types";

interface SaveTemplateDialogProps {
  config: ReconciliationConfig;
  fileA: ParsedFile;
  fileB: ParsedFile;
}

export function SaveTemplateDialog({
  config,
  fileA,
  fileB,
}: SaveTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setName("");
    setDescription("");
    setError(null);
    setIsDuplicate(false);
    setSuccess(false);
  };

  const handleSubmit = async (overwrite = false) => {
    setError(null);
    setIsDuplicate(false);

    if (!name.trim()) {
      setError("Le nom du modèle est obligatoire");
      return;
    }

    setIsSubmitting(true);

    const templateConfig = toTemplateConfig(config, fileA.headers, fileB.headers);
    const input = {
      templateName: name.trim(),
      description: description.trim() || undefined,
      config: templateConfig,
    };

    const result = overwrite
      ? await upsertTemplate(input)
      : await saveTemplate(input);

    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 1500);
      return;
    }

    if (result.duplicate) {
      setIsDuplicate(true);
      setError(result.error ?? null);
      return;
    }

    setError(result.error ?? "Erreur inconnue");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Sauvegarder comme modèle</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sauvegarder comme modèle</DialogTitle>
          <DialogDescription>
            Sauvegardez cette configuration pour la réutiliser lors de prochains rapprochements.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <p className="text-sm text-green-600 py-4">
            Modèle sauvegardé avec succès !
          </p>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="template-name">Nom du modèle *</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                  setIsDuplicate(false);
                }}
                placeholder="Ex: Rapprochement SAGE-ZEENDOC mensuel"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="template-description">Description (optionnel)</Label>
              <Input
                id="template-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Clé sur N° facture + code fournisseur"
                disabled={isSubmitting}
              />
            </div>

            {error && !isDuplicate && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {isDuplicate && (
              <div className="flex flex-col gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                <p className="text-sm text-orange-700">{error}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsDuplicate(false);
                      setError(null);
                    }}
                    disabled={isSubmitting}
                  >
                    Renommer
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleSubmit(true)}
                    disabled={isSubmitting}
                  >
                    Écraser
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {!success && (
          <DialogFooter>
            <Button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting || isDuplicate}
            >
              {isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

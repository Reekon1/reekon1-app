"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTemplate } from "@/lib/actions/templates";
import { updateTemplateSchema } from "@/lib/validators/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditTemplateFormProps {
  templateId: string;
  initialName: string;
  initialDescription: string;
}

export function EditTemplateForm({
  templateId,
  initialName,
  initialDescription,
}: EditTemplateFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const parsed = updateTemplateSchema.safeParse({
      templateName: name,
      description,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    const result = await updateTemplate(templateId, {
      templateName: parsed.data.templateName,
      description: parsed.data.description,
    });
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Erreur inconnue");
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/protected/templates");
    }, 800);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="template-name">Nom du modèle</Label>
        <Input
          id="template-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="template-description">Description (optionnelle)</Label>
        <Input
          id="template-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-green-600">Modèle mis à jour avec succès</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/protected/templates")}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}

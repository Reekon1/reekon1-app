"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SavedTemplate } from "@/lib/types/template";
import { DeleteTemplateDialog } from "@/components/reconcile/delete-template-dialog";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function TemplateCard({ template }: { template: SavedTemplate }) {
  const keyCount = template.config.keyColumnsA.length;
  const hasAmount = template.config.amountColumnA !== null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{template.templateName}</CardTitle>
        {template.description && (
          <CardDescription>{template.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{keyCount} colonne{keyCount > 1 ? "s" : ""} clé{keyCount > 1 ? "s" : ""}</span>
          {hasAmount && <span>Montant</span>}
          {template.config.deduplication && <span>Déduplication</span>}
          <span>Créé le {formatDate(template.createdAt)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={`/protected/reconcile?template=${template.id}`}>
              Utiliser
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/protected/templates/${template.id}`}>
              Modifier
            </Link>
          </Button>
          <DeleteTemplateDialog
            templateId={template.id}
            templateName={template.templateName}
          />
        </div>
      </CardContent>
    </Card>
  );
}

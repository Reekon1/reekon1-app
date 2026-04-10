import { Suspense } from "react";
import { getTemplate } from "@/lib/actions/templates";
import { EditTemplateForm } from "@/components/reconcile/edit-template-form";
import { notFound } from "next/navigation";

async function EditTemplateContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getTemplate(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const template = result.data;

  return (
    <>
      <EditTemplateForm
        templateId={template.id}
        initialName={template.templateName}
        initialDescription={template.description ?? ""}
      />

      <div className="rounded-md border p-4">
        <h2 className="text-sm font-medium mb-2">
          Configuration (lecture seule)
        </h2>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>
            {(template.config.keyMappings?.length ?? template.config.keyColumnsA.length)} colonne
            {(template.config.keyMappings?.length ?? template.config.keyColumnsA.length) > 1 ? "s" : ""} clé
            {(template.config.keyMappings?.length ?? template.config.keyColumnsA.length) > 1 ? "s" : ""}
          </span>
          {template.config.amountColumnA && <span>Montant</span>}
          {template.config.deduplication && <span>Déduplication</span>}
        </div>
      </div>
    </>
  );
}

export default function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h1 className="font-bold text-2xl">Modifier le modèle</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Modifiez le nom et la description de votre modèle
        </p>
      </div>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">
            Chargement du modèle...
          </p>
        }
      >
        <EditTemplateContent params={params} />
      </Suspense>
    </div>
  );
}

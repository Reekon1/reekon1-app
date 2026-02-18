import { Suspense } from "react";
import { listTemplates } from "@/lib/actions/templates";
import { TemplateCard } from "@/components/reconcile/template-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

async function TemplatesList() {
  const result = await listTemplates();
  const templates = result.success ? (result.data ?? []) : [];

  if (!result.success) {
    return <p className="text-sm text-red-600">{result.error}</p>;
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-muted-foreground">
          Aucun modèle sauvegardé. Effectuez un rapprochement et sauvegardez
          la configuration pour la réutiliser.
        </p>
        <Button asChild>
          <Link href="/protected/reconcile">Nouveau rapprochement</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {templates.map((t) => (
        <TemplateCard key={t.id} template={t} />
      ))}
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-bold text-2xl">Mes modèles</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Réutilisez vos configurations de rapprochement sauvegardées
        </p>
      </div>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Chargement des modèles...</p>
        }
      >
        <TemplatesList />
      </Suspense>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProtectedPage() {
  return (
    <div className="flex flex-col gap-6 items-center text-center py-12">
      <h1 className="font-bold text-3xl">Bienvenue sur Reekon</h1>
      <p className="text-muted-foreground max-w-md">
        Rapprochez vos fichiers comptables en quelques clics. Importez deux
        fichiers, configurez vos clés de correspondance, et obtenez un rapport
        détaillé des écarts.
      </p>
      <Button asChild size="lg">
        <Link href="/protected/reconcile">Nouveau rapprochement</Link>
      </Button>
    </div>
  );
}

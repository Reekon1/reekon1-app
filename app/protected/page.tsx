import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";

async function DashboardContent() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

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

export default function ProtectedPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}

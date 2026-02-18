import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { Suspense } from "react";

async function AccountInfo() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <p className="text-sm text-muted-foreground">
      Connecté en tant que{" "}
      <span className="font-medium text-foreground">{data.claims.email}</span>
    </p>
  );
}

export default function AccountPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8 max-w-2xl">
      <h1 className="font-bold text-2xl">Mon compte</h1>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense>
            <AccountInfo />
          </Suspense>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Zone de danger</CardTitle>
          <CardDescription>
            La suppression de votre compte est définitive et irréversible.
            Toutes vos données seront effacées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountButton />
        </CardContent>
      </Card>
    </div>
  );
}

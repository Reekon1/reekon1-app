"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export async function deleteAccount() {
  const supabase = await createClient();
  const { data, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !data?.claims) {
    return { error: "Non authentifié" };
  }

  const userId = data.claims.sub;

  // Supprimer les templates de l'utilisateur avant la suppression du compte (defense in depth)
  const { error: templatesError } = await supabase
    .from("reconciliation_templates")
    .delete()
    .eq("user_id", userId);

  if (templatesError) {
    return { error: "Impossible de supprimer vos données. Veuillez réessayer." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    return { error: "Impossible de supprimer le compte. Veuillez réessayer." };
  }

  await supabase.auth.signOut();
  redirect("/auth/login?deleted=1");
}

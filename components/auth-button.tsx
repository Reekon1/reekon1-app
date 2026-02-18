import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  return user ? (
    <div className="flex items-center gap-4">
      <Link
        href="/protected/account"
        className="text-sm underline-offset-4 hover:underline"
      >
        {user.email}
      </Link>
      <LogoutButton />
    </div>
  ) : (
    <Button asChild size="sm" variant="default">
      <Link href="/auth/login">Se connecter</Link>
    </Button>
  );
}

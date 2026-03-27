import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-8 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href="/protected">Reekon</Link>
              <Link
                href="/protected/reconcile"
                className="font-normal text-muted-foreground hover:text-foreground transition-colors"
              >
                Rapprochement
              </Link>
              <Link
                href="/protected/templates"
                className="font-normal text-muted-foreground hover:text-foreground transition-colors"
              >
                Modèles
              </Link>
            </div>
            <ThemeSwitcher />
          </div>
        </nav>
        <div className="flex-1 flex flex-col w-full max-w-5xl p-5">
          {children}
        </div>
        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-8">
          <p className="text-muted-foreground">Reekon</p>
        </footer>
      </div>
    </main>
  );
}

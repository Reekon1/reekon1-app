# Story 1.1: Initialisation du Projet et Infrastructure

Status: in-progress

## Story

En tant que développeur,
Je veux initialiser le projet avec le starter template officiel et configurer l'outillage de développement,
Afin de disposer d'une base de code fonctionnelle, déployable et prête pour le développement des fonctionnalités.

## Acceptance Criteria

1. **AC1 — Projet initialisé et fonctionnel localement**
   - **Given** aucun projet n'existe encore
   - **When** le développeur exécute les commandes d'initialisation
   - **Then** le projet Next.js démarre localement sans erreur avec `npm run dev`
   - **And** shadcn/ui est configuré et un composant Button peut être importé
   - **And** Vitest est configuré et un test trivial passe avec `npm run test`

2. **AC2 — Déploiement Vercel fonctionnel**
   - **Given** le projet est initialisé localement
   - **When** le développeur connecte le repo Git à Vercel
   - **Then** le déploiement automatique fonctionne sur la region `cdg1` (Paris)
   - **And** HTTPS/TLS est actif par défaut (FR42)
   - **And** les variables d'environnement Supabase sont configurées (`.env.local` + Vercel Dashboard)

3. **AC3 — Performance et sécurité de base**
   - **Given** le projet est déployé sur Vercel
   - **When** un utilisateur accède à l'URL de production
   - **Then** la page s'affiche en moins de 3 secondes (NFR-P2)
   - **And** la connexion est sécurisée en HTTPS/TLS 1.3 (NFR-S1)

4. **AC4 — Supabase connecté avec middleware Auth**
   - **Given** Supabase est configuré
   - **When** le développeur vérifie la connexion Supabase
   - **Then** le middleware Supabase Auth (refresh session cookie) est en place
   - **And** les variables d'environnement Supabase sont fonctionnelles (connexion DB OK)

## Tasks / Subtasks

- [x] Task 1 — Initialiser le projet Next.js (AC: #1)
  - [x] 1.1 Exécuter `npx create-next-app@latest reekon --example with-supabase`
  - [x] 1.2 Vérifier que `npm run dev` démarre sans erreur sur `http://localhost:3000`
  - [x] 1.3 Vérifier la structure de fichiers générée (app/, proxy.ts, lib/supabase/)

- [x] Task 2 — Configurer shadcn/ui (AC: #1)
  - [x] 2.1 shadcn/ui déjà pré-configuré par le starter (style: new-york, CSS variables: yes)
  - [x] 2.2 Button + Badge + Card + autres composants déjà inclus par le starter
  - [x] 2.3 Vérifier l'import `import { Button } from "@/components/ui/button"` — OK

- [x] Task 3 — Configurer Vitest + React Testing Library (AC: #1)
  - [x] 3.1 Installer les dépendances : `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths`
  - [x] 3.2 Créer `vitest.config.mts` avec configuration React + jsdom + path aliases
  - [x] 3.3 Ajouter le script `"test": "vitest"` dans package.json
  - [x] 3.4 Écrire un test trivial `lib/utils.test.ts` qui vérifie que `cn()` fonctionne (4 tests)
  - [x] 3.5 Vérifier que `npm run test` passe — 4 tests verts

- [x] Task 4 — Configurer Supabase (AC: #4)
  - [x] 4.1 Supabase local initialisé via `npx supabase init` + `npx supabase start` (Docker)
  - [x] 4.2 Clés récupérées : URL=http://127.0.0.1:54331, PUBLISHABLE_KEY (local)
  - [x] 4.3 Créer `.env.local` avec les variables Supabase
  - [x] 4.4 `.env.example` fourni par le starter
  - [x] 4.5 Proxy Auth fonctionne (proxy.ts remplace middleware.ts dans Next.js 16, refresh session cookie OK)
  - [x] 4.6 Magic link activé par défaut en local (Inbucket sur http://127.0.0.1:54334)

- [x] Task 5 — Configurer le dépôt Git (AC: #2)
  - [x] 5.1 Initialiser le dépôt Git : `git init`
  - [x] 5.2 Premier commit avec tout le code du projet
  - DEFERRED : 5.3-5.6 — Déploiement Vercel (cdg1) + GitHub remote — sera configuré ultérieurement quand le dev local sera suffisamment avancé

- [x] Task 6 — Configurer la CI basique (AC: #1)
  - [x] 6.1 Créer `.github/workflows/ci.yml` avec job Vitest sur push/PR
  - DEFERRED : 6.2 — Vérification GitHub Actions — en attente du push vers GitHub

## Dev Notes

### Architecture Patterns & Contraintes

**Stack technique exacte :**
- **Next.js 16.1.x LTS** — App Router, Server Components par défaut, Turbopack
- **React 19+** — avec React Compiler support
- **TypeScript** — strict mode activé
- **Tailwind CSS 4** — via le starter
- **shadcn/ui** — composants accessibles, CSS variables pour theming
- **Vitest** — framework de test, co-localisé (`*.test.ts` à côté du source)
- **Supabase** — Auth cookie-based via `@supabase/ssr`

**Commande d'initialisation exacte :**
```bash
npx create-next-app@latest reekon --example with-supabase
```

**Le starter `with-supabase` fournit déjà :**
- Structure App Router (`/app`)
- Middleware Supabase Auth (`middleware.ts`) avec refresh session cookie
- Clients Supabase pré-configurés :
  - `createBrowserClient` pour le client (via `@supabase/ssr`)
  - `createServerClient` pour le serveur (via `@supabase/ssr`)
- Pages auth de base (login, callback)
- Configuration TypeScript stricte
- Tailwind CSS

**Pattern middleware Supabase Auth (fourni par le starter) :**
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );
  // Refresh session si expirée
  await supabase.auth.getUser();
  return response;
}
```

**Configuration Vitest requise (`vitest.config.mts`) :**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

### Conventions de Nommage (Architecture)

| Contexte | Convention | Exemple |
|----------|-----------|---------|
| Tables DB | snake_case, pluriel | `reconciliation_templates` |
| Colonnes DB | snake_case | `user_id`, `created_at` |
| Routes API | kebab-case | `/api/reconcile` |
| Fichiers composants | kebab-case.tsx | `file-uploader.tsx` |
| Composants React | PascalCase | `FileUploader` |
| Fonctions/variables | camelCase | `parseFile()` |
| Types/interfaces | PascalCase | `ReconciliationResult` |
| Constantes | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |

### Project Structure Notes

**Structure cible du projet après cette story :**
```
reekon/
├── .env.local                    # Variables Supabase (NE PAS COMMITER)
├── .env.example                  # Template des variables
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml                # Vitest on push/PR
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.mts             # Config Vitest
├── components.json               # Config shadcn/ui
├── package.json
├── middleware.ts                  # Supabase Auth middleware (fourni par starter)
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/
│       └── button.tsx            # shadcn/ui Button (test d'installation)
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # createBrowserClient()
│   │   ├── server.ts             # createServerClient()
│   │   └── middleware.ts         # Auth middleware helpers
│   ├── utils.ts                  # cn() helper shadcn
│   └── utils.test.ts             # Test trivial Vitest
└── public/
    └── favicon.ico
```

**Alignement avec la structure architecture :** Cette story met en place la fondation. Les dossiers `lib/reconciliation/`, `lib/validators/`, `lib/types/`, `lib/actions/` et les pages `app/(dashboard)/`, `app/(auth)/` seront créés dans les stories suivantes quand elles en auront besoin.

### Risques et Points d'Attention

1. **Le starter `with-supabase` peut avoir évolué** — Vérifier que la structure générée correspond à ce qui est attendu. Adapter si nécessaire.
2. **Region Vercel `cdg1`** — Configurer dans Project Settings > Functions > Function Region. Ce n'est pas automatique.
3. **Ne PAS créer la table `reconciliation_templates`** dans cette story — elle sera créée dans la Story 5.1 quand elle sera nécessaire.
4. **Ne PAS modifier les pages auth du starter** — la Story 1.2 s'en chargera.
5. **Variables d'environnement** — S'assurer que `.env.local` est dans `.gitignore` (déjà le cas avec le starter).

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation] — Commandes d'initialisation et rationale du choix
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions] — Décisions stack technique
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] — Conventions de nommage
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure] — Structure cible complète
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment] — Config Vercel cdg1
- [Source: _bmad-output/planning-artifacts/prd.md#FR42] — Chiffrement données en transit
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-P2] — Temps de chargement < 3s
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-S1] — HTTPS/TLS 1.3
- [Source: Context7 /vercel/next.js/v16.1.5] — Documentation Next.js create-next-app
- [Source: Context7 /supabase/ssr] — Documentation @supabase/ssr middleware pattern

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Le starter Next.js 16 with-supabase a évolué : `proxy.ts` remplace `middleware.ts`, `getClaims()` remplace `getUser()`, la clé env s'appelle `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` au lieu de `ANON_KEY`
- shadcn/ui déjà pré-installé par le starter (Button, Badge, Card, Checkbox, DropdownMenu, Input, Label)
- Ports Supabase local changés en 5433x (au lieu de 5432x) pour éviter conflit avec le projet "dotme"

### Completion Notes List

- Task 1 : Next.js 16.1.6 initialisé avec le starter `with-supabase`, dev server démarre en ~700ms avec Turbopack
- Task 2 : shadcn/ui déjà pré-configuré par le starter, style new-york avec CSS variables
- Task 3 : Vitest 4.0.18 configuré avec React Testing Library, 4 tests unitaires pour `cn()` passent
- Task 4 : Supabase local (Docker) démarré avec ports personnalisés, `.env.local` configuré, proxy Auth vérifié
- Task 5 : Git initialisé + premier commit. Vercel/GitHub DEFERRED — sera configuré plus tard
- Task 6 : CI workflow créé (`.github/workflows/ci.yml`). Vérification GitHub Actions DEFERRED

### Change Log

- 2026-02-17 : Initialisation du projet Next.js 16.1.6 + shadcn/ui + Vitest + Supabase local + CI

### File List

- .env.local (new) — Variables Supabase local
- .env.example (starter) — Template variables
- .github/workflows/ci.yml (new) — CI Vitest on push/PR
- .gitignore (starter) — Fichiers ignorés
- app/ (starter) — Pages Next.js App Router
- components/ (starter) — Composants UI shadcn + auth
- components.json (starter) — Config shadcn/ui
- eslint.config.mjs (starter) — Config ESLint
- lib/supabase/client.ts (starter) — Client Supabase browser
- lib/supabase/server.ts (starter) — Client Supabase server
- lib/supabase/proxy.ts (starter) — Proxy Auth session refresh
- lib/utils.ts (starter) — cn() helper
- lib/utils.test.ts (new) — Tests unitaires cn()
- next.config.ts (starter) — Config Next.js
- package.json (modified) — Ajout script "test": "vitest" + deps testing
- postcss.config.mjs (starter) — Config PostCSS
- proxy.ts (starter) — Proxy entry point (remplace middleware.ts)
- README.md (starter) — Documentation
- supabase/config.toml (modified) — Ports Supabase personnalisés (5433x)
- tailwind.config.ts (starter) — Config Tailwind CSS
- tsconfig.json (starter) — Config TypeScript
- vitest.config.mts (new) — Config Vitest

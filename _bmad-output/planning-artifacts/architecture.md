---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-02-17'
inputDocuments:
  - product-brief-reekon-2026-01-29.md
  - prd.md
  - sample-data/instructions.txt
  - sample-data/DONNEES SAGE - Fichier source.csv
  - sample-data/DONNEES ZEENDOC - Fichier source.xlsx
  - sample-data/Synthèse Réconciliation.xlsx
workflowType: 'architecture'
project_name: 'reekon'
user_name: 'reekon'
date: '2026-02-17'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
43 FRs organisées en 8 domaines fonctionnels. Le coeur de valeur se concentre sur 3 blocs :
- **Ingestion & Parsing** (FR5-FR10) : Upload multi-format, détection automatique séparateurs/encodage, prévisualisation
- **Configuration & Rapprochement** (FR11-FR22) : Mapping colonnes, clés composites, nettoyage, déduplication, rapprochement bidirectionnel, analyse de variance
- **Résultats & Export** (FR23-FR33) : Dashboard synthèse, indicateurs visuels, rapport Excel multi-onglets, téléchargement automatique

Les blocs secondaires couvrent l'authentification (FR1-FR4), la gestion des modèles réutilisables (FR34-FR39), et la conformité RGPD (FR40-FR43).

**Non-Functional Requirements:**
- **Performance** : Traitement < 30s pour ≤ 5000 lignes, FCP < 3s, upload < 5s pour ≤ 10MB, réactivité UI < 200ms
- **Sécurité** : TLS 1.3, magic link expiration < 15min, session 24h, isolation données par utilisateur, destruction fichiers < 1s post-traitement, hébergement France
- **Fiabilité** : 99% uptime, < 1% erreurs système, messages d'erreur clairs
- **Utilisabilité** : Time-to-value < 10min, complétion sans aide au 1er essai, desktop-first (≥ 1024px)

**Insights des données échantillon (SAGE/ZEENDOC) :**
Les fichiers réels révèlent des contraintes non documentées dans le PRD mais critiques pour l'architecture :
- Encodage hétérogène entre systèmes (caractères spéciaux, retours chariot)
- Formats de codes fournisseur variables (code seul vs code-libellé)
- Nécessité de valeur absolue pour comparaison de montants
- Clé unique inter-système existante mais pas toujours disponible → besoin de clé reconstituée

### Scale & Complexity

- **Domaine principal** : Full-stack web (SaaS B2B)
- **Niveau de complexité** : Moyen
- **Composants architecturaux estimés** : 6-8 (Auth, File Upload, Parser Engine, Reconciliation Engine, Report Generator, Dashboard UI, Template Manager, API Layer)

### Technical Constraints & Dependencies

| Contrainte | Source | Impact architectural |
|------------|--------|---------------------|
| Solo dev junior | Ressources | Architecture simple, patterns standards, stack bien documentée |
| Stateless processing | RGPD | Traitement 100% en mémoire, pas de stockage intermédiaire |
| Hébergement OVH France | Conformité | Choix d'hébergement contraint, pas de régions US |
| NextJS API Routes | PRD | Limites de timeout serverless, gestion mémoire |
| Supabase Cloud (MVP) | PRD | Migration self-hosted V2 à anticiper dans le schéma |
| Fichiers ≤ 10MB / 5000 lignes | Performance | Dimensionne le traitement en mémoire pour MVP |

### Cross-Cutting Concerns Identified

1. **Normalisation d'encodage** — affecte parsing, rapprochement et export. Doit être un composant transversal.
2. **Cycle de vie des données éphémères** — RGPD impose un pattern strict : upload → traitement mémoire → résultat client → destruction. Aucun état intermédiaire persisté.
3. **Gestion mémoire** — fichiers traités entièrement en mémoire (API Routes). Risque de dépassement pour fichiers volumineux.
4. **Gestion d'erreurs utilisateur** — les données d'entrée sont imprévisibles (formats, encodages, colonnes manquantes). L'architecture doit être résiliente aux données "sales".
5. **Pipeline de transformation configurable** — les étapes de nettoyage/normalisation doivent être paramétrables par l'utilisateur (exclusion lignes, déduplication, normalisation encodage).

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application (SaaS B2B) basée sur Next.js 16 + Supabase, déployée sur Vercel.

### Versions Actuelles Vérifiées

| Technologie | Version | Source |
|-------------|---------|--------|
| Next.js | 16.1.6 LTS | nextjs.org |
| Supabase JS | Latest | supabase.com |
| shadcn/ui | Latest | ui.shadcn.com |
| Vitest | Latest | vitest.dev |

### Starter Options Considered

| Option | Maintenu par | Décision |
|--------|-------------|----------|
| `create-next-app --example with-supabase` | Supabase / Vercel (officiel) | **Retenu** |
| Nextbase (Next.js 16 + Supabase) | Communauté | Écarté — trop opinionated |
| supa-next-starter | Communauté | Écarté — maintenance incertaine |

### Selected Starter: `with-supabase` (officiel)

**Rationale :**
- Template officiel maintenu par Supabase et Vercel — fiabilité et compatibilité garanties
- Minimaliste et bien documenté — adapté à un solo dev junior
- Auth cookie-based pré-configurée — magic link prêt à l'emploi
- Aucune dépendance superflue — on ajoute uniquement ce dont on a besoin

**Initialization Command:**

```bash
npx create-next-app@latest reekon --example with-supabase
```

Puis compléter avec :

```bash
npx shadcn@latest init
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**
- TypeScript (strict mode)
- Node.js runtime (Next.js 16.1 LTS)
- React 19+ avec React Compiler support

**Styling Solution:**
- Tailwind CSS 4
- shadcn/ui (ajouté post-init) — composants accessibles, personnalisables
- CSS variables pour theming

**Build Tooling:**
- Turbopack (default dans Next.js 16) — Fast Refresh 5-10x plus rapide
- ESLint pour linting

**Testing Framework:**
- Vitest + React Testing Library (ajouté post-init)
- Playwright recommandé pour E2E (ajouté selon besoin)

**Code Organization:**
- App Router (structure `/app`)
- Server Components par défaut
- Middleware Supabase Auth pour gestion session cookie

**Development Experience:**
- Hot reload via Turbopack
- TypeScript strict
- Déploiement Vercel en un clic

**Note:** L'initialisation du projet avec cette commande devrait être la première story d'implémentation.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Traitement fichiers en mémoire via API Route (pas de stockage)
- RLS Supabase pour isolation données utilisateur
- Zod pour validation entrées/sorties
- Server Actions pour CRUD templates, API Route pour rapprochement

**Important Decisions (Shape Architecture):**
- Pas de state management global — React state local + Server Components
- shadcn/ui + composants métier sans abstraction prématurée
- Formulaire wizard multi-étapes avec validation Zod par étape
- Vercel region Paris (cdg1)

**Deferred Decisions (Post-MVP):**
- Rate limiting custom
- Monitoring avancé (Sentry/Datadog)
- Caching avancé
- Migration OVH self-hosted

### Data Architecture

| Décision | Choix | Rationale |
|----------|-------|-----------|
| Entités persistées | `users` (Supabase Auth) + `reconciliation_templates` | RGPD — seuls les modèles et comptes sont conservés |
| Validation | Zod | Standard Next.js, validation client+serveur, type-safe |
| Migrations | Supabase CLI (`supabase migration`) | Versionné, compatible migration self-hosted V2 |
| Caching | Cache natif Next.js + React.cache | Données éphémères = pas de caching complexe nécessaire |

### Authentication & Security

| Décision | Choix | Rationale |
|----------|-------|-----------|
| Auth | Supabase Auth magic link (cookie-based) | Fourni par starter, conforme FR1-FR4 |
| Isolation données | RLS `auth.uid() = user_id` | Best practice Supabase, conforme NFR-S4 |
| Session | Cookie refresh auto, expiration 24h | NFR-S3, middleware starter |
| Upload sécurisé | Validation serveur (MIME, taille, extension) | Pas de stockage, traitement mémoire uniquement |
| Chiffrement transit | TLS 1.3 (Vercel default) | NFR-S1 |

### API & Communication Patterns

| Décision | Choix | Rationale |
|----------|-------|-----------|
| Rapprochement | API Route (`/api/reconcile`) | Timeout configurable, upload fichiers, streaming progression |
| CRUD templates | Server Actions | Mutations simples, intégrées aux formulaires React |
| Format réponse | `{ success, data, error }` typé | Pattern uniforme, erreurs typées |
| Rate limiting | Aucun (MVP) | Protection DDoS Vercel suffisante pour MVP |

### Frontend Architecture

| Décision | Choix | Rationale |
|----------|-------|-----------|
| State management | React state local + Server Components | Flux linéaire, pas de state partagé complexe |
| Composants UI | shadcn/ui + composants métier | Accessible, personnalisable, pas de vendor lock-in |
| Parcours rapprochement | Wizard multi-étapes (state `currentStep`) | Simple, validation Zod par étape |
| Rendering | Server Components default, Client Components pour interactivité | Best practice Vercel/Next.js |

### Infrastructure & Deployment

| Décision | Choix | Rationale |
|----------|-------|-----------|
| Hosting | Vercel (region `cdg1` Paris) | Latence France, déploiement simple |
| CI/CD | Vercel Git Integration (auto-deploy main) | Zero config, preview deploys |
| Environnements | dev / preview / production | Standard Vercel |
| Monitoring | Vercel Analytics | Gratuit, suffisant MVP |
| API timeout | `maxDuration: 60` sur route rapprochement | Marge pour NFR-P1 (< 30s) |

### Decision Impact Analysis

**Séquence d'implémentation :**
1. Init projet (starter + shadcn + vitest)
2. Auth (Supabase Auth magic link — déjà dans starter)
3. Schéma DB + RLS (templates)
4. Upload fichiers + parsing
5. Moteur de rapprochement
6. Dashboard résultats + rapport Excel
7. Gestion templates (sauvegarde/chargement)

**Dépendances inter-composants :**
- Le moteur de rapprochement dépend du parser (même API Route, pipeline séquentiel)
- Le dashboard dépend du moteur (affiche les résultats)
- Les templates dépendent du schéma DB + RLS
- L'export Excel dépend du moteur (génère à partir des résultats)

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Base de données (PostgreSQL/Supabase) :**
- Tables : `snake_case`, pluriel → `reconciliation_templates`, `users`
- Colonnes : `snake_case` → `user_id`, `created_at`, `template_name`
- Clés étrangères : `{table_singulier}_id` → `user_id`
- Index : `idx_{table}_{colonnes}` → `idx_reconciliation_templates_user_id`

**API / JSON :**
- Routes : `kebab-case` → `/api/reconcile`, `/api/templates`
- Champs JSON réponse : `camelCase` → `{ templateName, createdAt }`
- Query params : `camelCase` → `?templateId=123`

**Code TypeScript :**
- Fichiers composants : `kebab-case.tsx` → `file-uploader.tsx`, `column-mapper.tsx`
- Composants React : `PascalCase` → `FileUploader`, `ColumnMapper`
- Fonctions/variables : `camelCase` → `parseFile()`, `reconcileData()`
- Types/interfaces : `PascalCase` → `ReconciliationResult`, `TemplateConfig`
- Constants : `UPPER_SNAKE_CASE` → `MAX_FILE_SIZE`, `SUPPORTED_FORMATS`

### Structure Patterns

**Organisation projet :**

```
app/
  (auth)/           # Routes auth (login, callback)
  (dashboard)/      # Routes protégées
    reconcile/      # Wizard de rapprochement
    templates/      # Gestion modèles
  api/
    reconcile/      # API Route rapprochement
  layout.tsx
  page.tsx
components/
  ui/               # shadcn/ui (généré)
  file-uploader.tsx
  column-mapper.tsx
  reconciliation-dashboard.tsx
  report-download.tsx
lib/
  supabase/
    client.ts       # Supabase browser client
    server.ts       # Supabase server client
    middleware.ts    # Auth middleware
  reconciliation/
    parser.ts       # Parsing multi-format
    normalizer.ts   # Normalisation encodage/données
    engine.ts       # Moteur de rapprochement
    report.ts       # Génération Excel
  validators/
    file.ts         # Validation upload (Zod)
    template.ts     # Validation templates (Zod)
  types/
    reconciliation.ts
    template.ts
```

**Tests co-localisés :**
- `lib/reconciliation/parser.test.ts` à côté de `parser.ts`
- `components/file-uploader.test.tsx` à côté du composant

### Format Patterns

**Réponse API standard :**

```typescript
// Succès
{ success: true, data: { ... } }

// Erreur
{ success: false, error: { code: "PARSE_ERROR", message: "Format non supporté" } }
```

**Codes erreur typés :**

```typescript
type ErrorCode =
  | "VALIDATION_ERROR"    // Données invalides (Zod)
  | "PARSE_ERROR"         // Fichier illisible ou format non supporté
  | "FILE_TOO_LARGE"      // > 10MB
  | "RECONCILIATION_ERROR"// Erreur pendant le rapprochement
  | "AUTH_ERROR"          // Non authentifié
  | "SYSTEM_ERROR"        // Erreur serveur inattendue
```

**Dates :** ISO 8601 (`2026-02-17T10:30:00Z`) dans JSON et DB.

### Process Patterns

**Gestion erreurs :**
- **Serveur** : try/catch dans chaque API Route/Server Action, retour `{ success: false, error }` typé
- **Client** : Error boundaries React pour les erreurs inattendues, gestion inline pour les erreurs métier
- **Logging** : `console.error` structuré côté serveur (message + contexte), jamais de données utilisateur dans les logs

**États de chargement :**
- Server Components : `loading.tsx` dans le dossier de route (Suspense automatique Next.js)
- Client Components : state local `isLoading` + composant Spinner shadcn
- API Route rapprochement : résultat complet (pas de streaming MVP)

**Validation :**
- **Côté client** : validation Zod avant soumission (feedback immédiat)
- **Côté serveur** : re-validation Zod systématique (ne jamais faire confiance au client)
- Pattern : schéma Zod partagé entre client et serveur (`lib/validators/`)

### Enforcement Guidelines

**Tout agent IA DOIT :**
1. Utiliser les conventions de nommage ci-dessus sans exception
2. Placer les fichiers dans la structure définie
3. Retourner le format `{ success, data/error }` pour toute API Route
4. Valider avec Zod côté serveur, même si la validation client existe
5. Ne jamais persister de fichier uploadé — traitement mémoire uniquement
6. Utiliser Server Components par défaut, Client Components uniquement si interactivité requise
7. Importer directement depuis les chemins (pas de barrel files `index.ts`)

**Anti-patterns à éviter :**
- `import { X } from '@/components'` → utiliser `import { X } from '@/components/x'`
- Stocker du state global pour des données lues une seule fois
- Mettre de la logique métier dans les composants React — la logique métier va dans `lib/`
- Utiliser `useEffect` pour dériver du state — calculer pendant le render

## Project Structure & Boundaries

### Requirements to Structure Mapping

| Catégorie FR | Répertoire principal | Fichiers clés |
|-------------|---------------------|---------------|
| Auth (FR1-FR4) | `app/(auth)/` | login, callback, signout |
| Import fichiers (FR5-FR10) | `components/`, `lib/reconciliation/parser.ts` | file-uploader, previewer |
| Config rapprochement (FR11-FR15) | `app/(dashboard)/reconcile/` | column-mapper, key-builder |
| Traitement (FR16-FR22) | `lib/reconciliation/engine.ts` | Moteur de rapprochement |
| Résultats (FR23-FR28) | `components/`, `app/(dashboard)/reconcile/` | dashboard, indicateurs |
| Export (FR29-FR33) | `lib/reconciliation/report.ts` | Génération Excel |
| Templates (FR34-FR39) | `app/(dashboard)/templates/`, `lib/actions/` | CRUD Server Actions |
| Conformité (FR40-FR43) | `lib/reconciliation/`, `middleware.ts` | Destruction, RLS, TLS |

### Complete Project Directory Structure

```
reekon/
├── .env.local                          # Variables Supabase (NEXT_PUBLIC_SUPABASE_URL, etc.)
├── .env.example                        # Template des variables d'environnement
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml                      # Vitest on push/PR
├── next.config.ts                      # Config Next.js (region cdg1, maxDuration)
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.mts                   # Config Vitest + React Testing Library
├── components.json                     # Config shadcn/ui
├── package.json
│
├── public/
│   └── favicon.ico
│
├── app/
│   ├── globals.css                     # Tailwind + CSS variables shadcn
│   ├── layout.tsx                      # Root layout (Server Component)
│   ├── page.tsx                        # Landing / redirect vers dashboard
│   │
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx                # FR2 — Formulaire magic link
│   │   ├── callback/
│   │   │   └── route.ts                # Callback Supabase Auth
│   │   └── signout/
│   │       └── route.ts                # FR3 — Déconnexion
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # Layout protégé (vérifie session)
│   │   │
│   │   ├── reconcile/
│   │   │   ├── page.tsx                # FR5-FR6 — Wizard étape 1 : upload
│   │   │   ├── configure/
│   │   │   │   └── page.tsx            # FR11-FR15 — Wizard étape 2 : config
│   │   │   ├── results/
│   │   │   │   └── page.tsx            # FR23-FR28 — Wizard étape 3 : résultats
│   │   │   └── loading.tsx             # Suspense pendant traitement
│   │   │
│   │   ├── templates/
│   │   │   ├── page.tsx                # FR36 — Liste des modèles
│   │   │   └── [id]/
│   │   │       └── page.tsx            # FR37-FR38 — Détail/édition modèle
│   │   │
│   │   └── account/
│   │       └── page.tsx                # FR4 — Suppression compte
│   │
│   └── api/
│       └── reconcile/
│           └── route.ts                # FR16-FR22 — API Route traitement
│
├── components/
│   ├── ui/                             # shadcn/ui (généré automatiquement)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   ├── progress.tsx
│   │   └── ...
│   │
│   ├── file-uploader.tsx               # FR5-FR7 — Upload drag & drop multi-format
│   ├── file-uploader.test.tsx
│   ├── file-preview.tsx                # FR10 — Prévisualisation données importées
│   ├── column-mapper.tsx               # FR11-FR12 — Sélection colonnes + clés composites
│   ├── column-mapper.test.tsx
│   ├── reconciliation-dashboard.tsx    # FR23-FR28 — Dashboard synthèse
│   ├── reconciliation-dashboard.test.tsx
│   ├── report-download.tsx             # FR29-FR33 — Bouton téléchargement Excel
│   ├── template-form.tsx               # FR34-FR35 — Formulaire sauvegarde modèle
│   └── template-card.tsx               # FR36 — Carte modèle dans la liste
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # createBrowserClient()
│   │   ├── server.ts                   # createServerClient()
│   │   └── middleware.ts               # Refresh session cookie
│   │
│   ├── reconciliation/
│   │   ├── parser.ts                   # FR7-FR9 — Parsing xlsx/xls/csv/txt
│   │   ├── parser.test.ts
│   │   ├── normalizer.ts               # Normalisation encodage, trim, abs()
│   │   ├── normalizer.test.ts
│   │   ├── engine.ts                   # FR16-FR22 — Rapprochement bidirectionnel
│   │   ├── engine.test.ts
│   │   ├── report.ts                   # FR29-FR32 — Génération Excel (exceljs)
│   │   └── report.test.ts
│   │
│   ├── actions/
│   │   ├── templates.ts                # Server Actions CRUD templates
│   │   └── account.ts                  # Server Action suppression compte
│   │
│   ├── validators/
│   │   ├── file.ts                     # Zod — validation upload (taille, format)
│   │   └── template.ts                 # Zod — validation template
│   │
│   ├── types/
│   │   ├── reconciliation.ts           # Types résultats, config, écarts
│   │   └── template.ts                 # Types modèles sauvegardés
│   │
│   └── utils.ts                        # cn() helper shadcn + utilitaires partagés
│
├── middleware.ts                        # Supabase Auth middleware (refresh session)
│
└── supabase/
    ├── config.toml                     # Config Supabase CLI locale
    └── migrations/
        └── 00001_create_templates.sql  # Schéma reconciliation_templates + RLS
```

### Architectural Boundaries

**Boundary API (route `/api/reconcile`) :**
- **Entrée** : FormData avec 2 fichiers + configuration JSON (colonnes, clés, options)
- **Traitement** : Parser → Normalizer → Engine → Report (pipeline séquentiel en mémoire)
- **Sortie** : `{ success, data: { summary, reportBuffer } }` — le buffer Excel encodé base64
- **Contrainte** : tout le cycle en mémoire, aucune écriture disque, destruction implicite en fin de requête

**Boundary Auth (middleware.ts) :**
- Intercepte toutes les routes `(dashboard)/`
- Refresh le cookie session Supabase
- Redirige vers `/login` si non authentifié
- L'API Route `/api/reconcile` vérifie la session indépendamment

**Boundary Data (Supabase) :**
- Seule la table `reconciliation_templates` est accédée par l'application
- RLS activé : `auth.uid() = user_id` sur SELECT, INSERT, UPDATE, DELETE
- Aucune donnée de fichier uploadé ne transite par Supabase

**Boundary Components :**
- Les composants `components/` sont des Client Components (interactivité)
- Les pages `app/` sont des Server Components par défaut
- La logique métier vit dans `lib/` — les composants appellent `lib/`, jamais l'inverse

### Data Flow — Parcours de rapprochement

```
[1. Upload]                    [2. Configuration]              [3. Résultats]
FileUploader (client)    →    ColumnMapper (client)      →    Dashboard (client)
    ↓                              ↓                              ↓
FormData (2 fichiers)         Config JSON (clés,           Affichage summary
    ↓                         colonnes, options)                  ↓
    └──────────────────────────────┘                       ReportDownload (client)
                ↓                                                 ↓
        POST /api/reconcile                                Téléchargement .xlsx
                ↓
    ┌─ parser.ts (parse xlsx/csv/txt)
    ├─ normalizer.ts (encodage, trim, abs)
    ├─ engine.ts (rapprochement bidirectionnel)
    └─ report.ts (génération Excel)
                ↓
    { summary, reportBase64 }
                ↓
    Réponse JSON → Client
    (fichiers détruits = fin requête = GC mémoire)
```

### Development Workflow

**Développement local :**
- `npm run dev` — Next.js dev server + Turbopack
- `npx supabase start` — Supabase local (Docker)
- Variables `.env.local` pointent vers Supabase local

**Tests :**
- `npm run test` — Vitest watch mode
- Tests co-localisés (`*.test.ts` à côté du source)
- Focus testing sur `lib/reconciliation/` (logique métier critique)

**Déploiement :**
- Push `main` → Vercel production auto-deploy
- Push branche → Vercel preview deployment
- Variables d'environnement production dans Vercel Dashboard

## Architecture Validation Results

### Coherence Validation ✅

- **Compatibilité stack** : toutes les technologies sont compatibles et maintenues ensemble
- **Patterns consistants** : conventions de nommage cohérentes à travers toutes les couches
- **Structure alignée** : l'arborescence reflète exactement les décisions architecturales

### Requirements Coverage ✅

- **43/43 FRs** couvertes par au moins un composant architectural
- **16/17 NFRs** pleinement supportées
- **1 NFR** (S6 hébergement France) partiellement couverte — acceptable pour MVP, résolution V2

### Implementation Readiness ✅

- Décisions complètes avec versions vérifiées
- Patterns d'implémentation couvrent tous les points de conflit potentiels
- Structure projet spécifique (pas de placeholders génériques)
- Mapping FR → fichiers explicite pour chaque exigence

### Gap Analysis

| Priorité | Gap | Impact | Résolution |
|----------|-----|--------|------------|
| ⚠️ Important | Supabase Cloud pas en France | Templates non-sensibles uniquement | Self-hosted OVH en V2 |
| Info | Pas de schéma SQL explicite | Migration file le définira | Première story d'implémentation |

### Architecture Completeness Checklist

**✅ Analyse des exigences**
- [x] Contexte projet analysé en profondeur
- [x] Échelle et complexité évaluées
- [x] Contraintes techniques identifiées
- [x] Préoccupations transversales mappées

**✅ Décisions architecturales**
- [x] Décisions critiques documentées avec versions
- [x] Stack technique entièrement spécifiée
- [x] Patterns d'intégration définis
- [x] Performance adressée

**✅ Patterns d'implémentation**
- [x] Conventions de nommage établies
- [x] Patterns structurels définis
- [x] Patterns de communication spécifiés
- [x] Patterns de processus documentés

**✅ Structure projet**
- [x] Arborescence complète définie
- [x] Boundaries composants établies
- [x] Points d'intégration mappés
- [x] Mapping exigences → structure complet

### Architecture Readiness Assessment

**Statut global : PRÊT POUR L'IMPLÉMENTATION**

**Niveau de confiance : Élevé**

**Forces clés :**
- Architecture simple et cohérente, adaptée à un solo dev junior
- Stack mainstream très bien documentée (Next.js + Supabase + Vercel)
- Contrainte RGPD résolue élégamment (traitement mémoire, pas de stockage)
- Patterns clairs qui préviennent les conflits entre agents IA

**Améliorations futures (V2) :**
- Migration Supabase self-hosted sur OVH France
- Monitoring avancé (Sentry)
- Rate limiting custom
- Streaming de progression pour fichiers volumineux

### Implementation Handoff

**Première priorité :**

```bash
npx create-next-app@latest reekon --example with-supabase
npx shadcn@latest init
```

**Guidelines agents IA :**
- Suivre toutes les décisions architecturales exactement comme documentées
- Utiliser les patterns d'implémentation de manière consistante
- Respecter la structure projet et les boundaries
- Se référer à ce document pour toute question architecturale

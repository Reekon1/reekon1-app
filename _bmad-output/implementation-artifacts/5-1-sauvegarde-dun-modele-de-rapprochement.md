# Story 5.1: Sauvegarde d'un Modèle de Rapprochement

Status: review

## Story

As a utilisateur ayant terminé un rapprochement,
I want sauvegarder la configuration de mon rapprochement actuel comme modèle réutilisable avec un nom et une description,
so that je ne reconfigure pas manuellement les mêmes paramètres pour des rapprochements récurrents.

## Acceptance Criteria

1. **Given** l'utilisateur est sur la page de résultats après un rapprochement réussi, **When** il clique sur "Sauvegarder comme modèle", **Then** un formulaire s'affiche avec un champ "Nom du modèle" (obligatoire) et un champ "Description" (optionnel) (FR35).

2. **Given** cette story est la première à nécessiter la persistance de données, **When** le développeur implémente la sauvegarde, **Then** une migration Supabase crée la table `reconciliation_templates` avec colonnes `id` (uuid, PK, default gen_random_uuid()), `user_id` (uuid, FK auth.users, NOT NULL), `template_name` (text, NOT NULL), `description` (text), `config` (jsonb, NOT NULL), `created_at` (timestamptz, default now()), `updated_at` (timestamptz, default now()). RLS activé : `auth.uid() = user_id` sur SELECT, INSERT, UPDATE, DELETE. Index sur `user_id`.

3. **Given** l'utilisateur remplit le nom et soumet le formulaire, **When** la Server Action s'exécute, **Then** la configuration complète est sauvegardée : noms de colonnes clés (simples ou composites) pour chaque fichier, nom de colonne montant, options de nettoyage, option de déduplication (FR34). Le `user_id` est associé via `auth.uid()`. Message de confirmation affiché.

4. **Given** l'utilisateur tente de sauvegarder sans nom, **When** il soumet, **Then** message d'erreur "Le nom du modèle est obligatoire" (validation Zod client + serveur).

5. **Given** l'utilisateur tente de sauvegarder avec un nom déjà utilisé, **When** il soumet, **Then** message d'avertissement proposant de renommer ou d'écraser le modèle existant.

6. **Given** un utilisateur supprime son compte (Story 1.4), **When** `deleteAccount()` s'exécute, **Then** ses templates sont supprimés avant la suppression du compte auth.

## Tasks / Subtasks

- [x] Task 1 : Migration Supabase (AC: #2)
  - [x] 1.1 Créer `supabase/migrations/00001_create_templates.sql` avec table `reconciliation_templates`
  - [x] 1.2 Activer RLS et créer les 4 policies (SELECT, INSERT, UPDATE, DELETE) avec `auth.uid() = user_id`
  - [x] 1.3 Créer index `idx_reconciliation_templates_user_id` sur `user_id`
  - [x] 1.4 Créer unique constraint `uq_reconciliation_templates_user_name` sur `(user_id, template_name)`

- [x] Task 2 : Types et validation Zod (AC: #3, #4)
  - [x] 2.1 Créer `lib/types/template.ts` avec interface `TemplateConfig` (colonnes par nom, pas par index)
  - [x] 2.2 Créer `lib/validators/template.ts` avec schéma Zod `saveTemplateSchema`

- [x] Task 3 : Server Actions templates (AC: #3, #5)
  - [x] 3.1 Créer `lib/actions/templates.ts` avec `saveTemplate()` Server Action
  - [x] 3.2 Implémenter la vérification de nom dupliqué et retourner un flag `duplicate: true` si existant
  - [x] 3.3 Implémenter `upsertTemplate()` pour le cas "écraser le modèle existant"

- [x] Task 4 : Composant UI "Sauvegarder comme modèle" (AC: #1, #4, #5)
  - [x] 4.1 Créer `components/reconcile/save-template-dialog.tsx` — dialog modal avec formulaire nom + description
  - [x] 4.2 Intégrer dans `ResultsDashboard` via bouton "Sauvegarder comme modèle" à côté du bouton "Nouveau rapprochement"
  - [x] 4.3 Gérer l'état dupliqué : proposer "Renommer" ou "Écraser"

- [x] Task 5 : Mise à jour `deleteAccount()` (AC: #6)
  - [x] 5.1 Ajouter suppression des templates utilisateur dans `lib/actions/account.ts` avant suppression du compte

- [x] Task 6 : Tests
  - [x] 6.1 Test unitaire validateur Zod `lib/validators/template.test.ts`
  - [x] 6.2 Test unitaire conversion config indices → noms `lib/types/template.test.ts`

## Dev Notes

### Architecture critique — Config par NOM de colonne, pas par INDEX

La `ReconciliationConfig` actuelle (`lib/reconciliation/types.ts`) utilise des **indices de colonnes** (`keyColumnsA: number[]`). Mais pour les templates réutilisables, stocker des indices n'a pas de sens car les prochains fichiers peuvent avoir des colonnes dans un ordre différent.

**Le template doit stocker les NOMS de colonnes (headers)**, pas les indices. Créer un type `TemplateConfig` distinct qui utilise `string[]` au lieu de `number[]`.

Fonction de conversion nécessaire :
```typescript
// Convertir ReconciliationConfig (indices) → TemplateConfig (noms)
function toTemplateConfig(config: ReconciliationConfig, headersA: string[], headersB: string[]): TemplateConfig

// L'inverse sera nécessaire dans Story 5.2 (application d'un modèle)
```

### Patterns existants à respecter

**Server Actions** — Suivre exactement le pattern de `lib/actions/account.ts:7-29` :
```typescript
"use server";
const supabase = await createClient();
const { data, error: claimsError } = await supabase.auth.getClaims();
if (claimsError || !data?.claims) return { error: "Non authentifié" };
const userId = data.claims.sub;
```

**Supabase client** — Utiliser `createClient()` de `lib/supabase/server.ts` dans les Server Actions (PAS l'admin client). Le RLS se charge de l'isolation via `auth.uid()`.

**Format réponse** — `{ success: true, data: ... }` ou `{ success: false, error: "message" }`. Pas de throw dans les Server Actions.

**Validation Zod** — Client + serveur, schéma partagé dans `lib/validators/template.ts`.

### Composant Dialog

Utiliser le composant Dialog de shadcn/ui. Vérifier si `components/ui/dialog.tsx` existe déjà (non ajouté dans le starter original). Si absent, l'ajouter via `npx shadcn@latest add dialog`.

Le dialog est déclenché depuis `ResultsDashboard` (`components/reconcile/results-dashboard.tsx:245-249`), zone des boutons d'action en bas de page. Le composant `SaveTemplateDialog` reçoit en props la config actuelle ET les headers des deux fichiers pour la conversion indices→noms.

### Table Supabase `reconciliation_templates`

```sql
CREATE TABLE reconciliation_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  description text,
  config jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX uq_reconciliation_templates_user_name
  ON reconciliation_templates(user_id, template_name);

CREATE INDEX idx_reconciliation_templates_user_id
  ON reconciliation_templates(user_id);

ALTER TABLE reconciliation_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own templates"
  ON reconciliation_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
  ON reconciliation_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON reconciliation_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON reconciliation_templates FOR DELETE
  USING (auth.uid() = user_id);
```

Note : `ON DELETE CASCADE` sur `user_id` signifie que si Supabase Auth supprime l'utilisateur, les templates sont automatiquement supprimés. Cependant, `deleteAccount()` dans `lib/actions/account.ts` devrait aussi supprimer explicitement les templates avant l'appel admin (defense in depth).

### Structure `TemplateConfig` (stockée en JSONB)

```typescript
// lib/types/template.ts
export interface TemplateConfig {
  keyColumnsA: string[];       // Noms des colonnes clé Système A
  keyColumnsB: string[];       // Noms des colonnes clé Système B
  amountColumnA: string | null; // Nom colonne montant A
  amountColumnB: string | null; // Nom colonne montant B
  excludeHeaderRowsA: number;
  excludeHeaderRowsB: number;
  excludeFooterRowsA: number;
  excludeFooterRowsB: number;
  deduplication: boolean;
}

export interface SavedTemplate {
  id: string;
  templateName: string;
  description: string | null;
  config: TemplateConfig;
  createdAt: string;
  updatedAt: string;
}
```

### Schéma Zod

```typescript
// lib/validators/template.ts
import { z } from "zod";

export const templateConfigSchema = z.object({
  keyColumnsA: z.array(z.string()).min(1),
  keyColumnsB: z.array(z.string()).min(1),
  amountColumnA: z.string().nullable(),
  amountColumnB: z.string().nullable(),
  excludeHeaderRowsA: z.number().int().min(0),
  excludeHeaderRowsB: z.number().int().min(0),
  excludeFooterRowsA: z.number().int().min(0),
  excludeFooterRowsB: z.number().int().min(0),
  deduplication: z.boolean(),
});

export const saveTemplateSchema = z.object({
  templateName: z.string().min(1, "Le nom du modèle est obligatoire").max(100),
  description: z.string().max(500).optional().default(""),
  config: templateConfigSchema,
});
```

### Intégration dans ResultsDashboard

Le composant `ResultsDashboard` (`components/reconcile/results-dashboard.tsx`) doit recevoir **en plus** la config de rapprochement utilisée et les headers des deux fichiers. Modifier les props :

```typescript
interface ResultsDashboardProps {
  result: ReconciliationResult;
  fileA: ParsedFile;
  fileB: ParsedFile;
  config: ReconciliationConfig;  // NOUVEAU — nécessaire pour sauvegarder le template
  onNewReconciliation: () => void;
}
```

Passer `config` depuis `app/protected/reconcile/page.tsx` — stocker la config dans un state supplémentaire lors du `handleReconcile`.

### Mise à jour `deleteAccount()`

```typescript
// lib/actions/account.ts — ajouter avant la suppression du compte :
const { error: templatesError } = await supabase
  .from("reconciliation_templates")
  .delete()
  .eq("user_id", userId);

if (templatesError) {
  return { error: "Impossible de supprimer vos données. Veuillez réessayer." };
}
```

### Fichiers à créer / modifier

| Action | Fichier | Raison |
|--------|---------|--------|
| CREATE | `supabase/migrations/00001_create_templates.sql` | Table + RLS + index |
| CREATE | `lib/types/template.ts` | Types TemplateConfig, SavedTemplate |
| CREATE | `lib/validators/template.ts` | Schéma Zod save template |
| CREATE | `lib/actions/templates.ts` | Server Actions save/upsert |
| CREATE | `components/reconcile/save-template-dialog.tsx` | UI dialog sauvegarde |
| CREATE | `lib/validators/template.test.ts` | Tests validateur |
| CREATE | `lib/types/template.test.ts` | Tests conversion config |
| MODIFY | `components/reconcile/results-dashboard.tsx` | Ajouter bouton + props config |
| MODIFY | `app/protected/reconcile/page.tsx` | Passer config à ResultsDashboard |
| MODIFY | `lib/actions/account.ts` | Supprimer templates avant compte |
| ADD | `components/ui/dialog.tsx` | Ajouter via `npx shadcn@latest add dialog` |

### Project Structure Notes

- Tous les fichiers suivent les conventions de nommage kebab-case pour les fichiers
- Server Actions dans `lib/actions/` (pattern établi)
- Types dans `lib/types/` (pas de barrel exports, imports directs)
- Validators dans `lib/validators/`
- Composants reconcile dans `components/reconcile/`
- Migration Supabase dans `supabase/migrations/`
- Tests co-localisés (`*.test.ts` à côté du source)

### Anti-patterns à éviter

- NE PAS stocker les indices de colonnes dans le template — utiliser les NOMS
- NE PAS utiliser l'admin client pour les opérations CRUD templates — le RLS suffit avec le client standard
- NE PAS créer de state management global — le dialog reçoit les props en direct
- NE PAS créer de route API pour sauvegarder — utiliser une Server Action
- NE PAS ajouter de dépendances supplémentaires — tout est déjà disponible (Supabase, Zod, shadcn)

### Dépendances

- `zod` — déjà dans package.json (vérifié)
- `@supabase/supabase-js` + `@supabase/ssr` — déjà dans package.json
- `shadcn/ui dialog` — potentiellement à ajouter via CLI

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1]
- [Source: lib/reconciliation/types.ts — ReconciliationConfig interface]
- [Source: lib/actions/account.ts — Server Action pattern + TODO template deletion]
- [Source: components/reconcile/results-dashboard.tsx — integration point]
- [Source: app/protected/reconcile/page.tsx — state management flow]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Zod v4 installe (pas v3 comme prevu) — `.issues` au lieu de `.errors` pour l'acces aux erreurs de validation

### Completion Notes List

- Task 1: Migration SQL creee avec table, RLS (4 policies), index user_id, unique constraint (user_id, template_name), ON DELETE CASCADE
- Task 2: Types `TemplateConfig` et `SavedTemplate` crees avec conversion indices→noms via `toTemplateConfig()`. Schema Zod `saveTemplateSchema` avec validation nom obligatoire et limites de longueur
- Task 3: Server Actions `saveTemplate()` et `upsertTemplate()` implementees suivant le pattern existant (createClient + getClaims). Detection de doublon avec flag `duplicate: true`
- Task 4: Composant `SaveTemplateDialog` cree avec formulaire nom+description, gestion etat duplique (Renommer/Ecraser), message de succes. Integre dans `ResultsDashboard` a cote du bouton "Nouveau rapprochement"
- Task 5: `deleteAccount()` mis a jour pour supprimer les templates avant la suppression du compte (defense in depth)
- Task 6: 17 tests unitaires ajoutes — 11 pour le validateur Zod, 6 pour la conversion config. Tous passent, 0 regression

### File List

- CREATE `supabase/migrations/00001_create_templates.sql`
- CREATE `lib/types/template.ts`
- CREATE `lib/validators/template.ts`
- CREATE `lib/actions/templates.ts`
- CREATE `components/reconcile/save-template-dialog.tsx`
- CREATE `lib/validators/template.test.ts`
- CREATE `lib/types/template.test.ts`
- CREATE `components/ui/dialog.tsx` (via shadcn CLI)
- MODIFY `components/reconcile/results-dashboard.tsx` — ajout prop `config`, import + integration `SaveTemplateDialog`
- MODIFY `app/protected/reconcile/page.tsx` — ajout state `lastConfig`, passage a `ResultsDashboard`
- MODIFY `lib/actions/account.ts` — suppression templates avant suppression compte
- MODIFY `package.json` / `package-lock.json` — ajout `zod`, `radix-ui` (dialog)

### Change Log

- 2026-02-18: Implementation complete story 5.1 — sauvegarde de modeles de rapprochement (6 tasks, 17 tests, 0 regression)

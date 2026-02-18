# Story 5.2: Liste et Application des Modèles Sauvegardés

Status: review

## Story

As a utilisateur ayant des modèles de rapprochement sauvegardés,
I want voir la liste de mes modèles et pouvoir en appliquer un à un nouveau rapprochement,
so that je gagne du temps en réutilisant une configuration déjà éprouvée.

## Acceptance Criteria

1. **Given** un utilisateur authentifié accède à la page `/protected/templates`, **When** la page s'affiche, **Then** la liste de ses modèles sauvegardés est affichée sous forme de cartes. Chaque carte affiche : nom du modèle, description, date de création, résumé de la configuration (nombre de colonnes clés, déduplication activée ou non). Seuls les modèles de l'utilisateur connecté sont visibles (RLS `auth.uid() = user_id`) (FR36, FR43).

2. **Given** l'utilisateur n'a aucun modèle sauvegardé, **When** la page `/protected/templates` s'affiche, **Then** un message s'affiche : "Aucun modèle sauvegardé. Effectuez un rapprochement et sauvegardez la configuration pour la réutiliser." et un bouton "Nouveau rapprochement" redirige vers `/protected/reconcile`.

3. **Given** l'utilisateur clique sur "Utiliser ce modèle" sur une carte, **When** il est redirigé vers `/protected/reconcile`, **Then** après l'upload et le parsing des fichiers, la configuration du modèle est pré-remplie automatiquement à l'étape de configuration : colonnes clés, colonne montant, options de nettoyage et déduplication sont restaurées depuis le modèle (FR37).

4. **Given** un modèle est appliqué mais les fichiers uploadés n'ont pas les mêmes colonnes que lors de la sauvegarde, **When** l'étape de configuration s'affiche avec le modèle pré-rempli, **Then** les colonnes manquantes sont signalées en rouge avec un message : "Colonne '{nom}' non trouvée dans le fichier" et l'utilisateur peut corriger manuellement le mapping.

5. **Given** le lien "Modèles" est ajouté dans la navigation, **When** l'utilisateur navigue dans l'app, **Then** le lien est visible dans la barre de navigation à côté de "Rapprochement".

## Tasks / Subtasks

- [x] Task 1 : Server Action pour lister les templates (AC: #1, #2)
  - [x] 1.1 Ajouter `listTemplates()` dans `lib/actions/templates.ts` — retourne les templates de l'utilisateur triés par `updated_at` DESC
  - [x] 1.2 Ajouter `getTemplate(id: string)` dans `lib/actions/templates.ts` — retourne un template par ID

- [x] Task 2 : Fonction de conversion TemplateConfig → ReconciliationConfig (AC: #3, #4)
  - [x] 2.1 Ajouter `fromTemplateConfig()` dans `lib/types/template.ts` — inverse de `toTemplateConfig()`, résout les noms de colonnes en indices
  - [x] 2.2 Retourner `{ config, warnings }` où `warnings` est un tableau des colonnes non trouvées

- [x] Task 3 : Page `/protected/templates` (AC: #1, #2)
  - [x] 3.1 Créer `app/protected/templates/page.tsx` — page serveur qui fetch les templates via `listTemplates()`
  - [x] 3.2 Créer `components/reconcile/template-card.tsx` — carte affichant nom, description, date, résumé config
  - [x] 3.3 Gérer l'état vide : message + bouton "Nouveau rapprochement"

- [x] Task 4 : Application d'un template au wizard de rapprochement (AC: #3, #4)
  - [x] 4.1 Modifier `app/protected/reconcile/page.tsx` — accepter un query param `?template=<id>`, charger le template, le stocker en state
  - [x] 4.2 Modifier `components/reconcile/configure-step.tsx` — accepter une prop `initialConfig` optionnelle de type `ReconciliationConfig` + `warnings: string[]`, pré-remplir les champs
  - [x] 4.3 Afficher les warnings de colonnes non trouvées en rouge dans le formulaire de configuration

- [x] Task 5 : Navigation (AC: #5)
  - [x] 5.1 Ajouter le lien "Modèles" dans `app/protected/layout.tsx` pointant vers `/protected/templates`

- [x] Task 6 : Tests
  - [x] 6.1 Test unitaire `fromTemplateConfig()` — conversion noms → indices, gestion colonnes manquantes
  - [x] 6.2 Test unitaire `fromTemplateConfig()` — cas limites (toutes colonnes manquantes, headers vides)

## Dev Notes

### Architecture critique — Conversion TemplateConfig → ReconciliationConfig

Story 5.1 a créé `toTemplateConfig()` (indices → noms). Cette story nécessite l'inverse : `fromTemplateConfig()` (noms → indices). La fonction doit gérer le cas où une colonne du template n'existe pas dans les nouveaux fichiers.

```typescript
// lib/types/template.ts — AJOUTER
interface ApplyTemplateResult {
  config: ReconciliationConfig;
  warnings: string[];  // Colonnes non trouvées
}

export function fromTemplateConfig(
  template: TemplateConfig,
  headersA: string[],
  headersB: string[]
): ApplyTemplateResult {
  const warnings: string[] = [];

  const resolveIndex = (name: string, headers: string[], system: string): number => {
    const idx = headers.findIndex(
      (h) => h.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (idx === -1) {
      warnings.push(`Colonne '${name}' non trouvée dans ${system}`);
      return 0; // fallback to first column
    }
    return idx;
  };

  return {
    config: {
      keyColumnsA: template.keyColumnsA.map((n) => resolveIndex(n, headersA, "Système A")),
      keyColumnsB: template.keyColumnsB.map((n) => resolveIndex(n, headersB, "Système B")),
      amountColumnA: template.amountColumnA
        ? resolveIndex(template.amountColumnA, headersA, "Système A")
        : null,
      amountColumnB: template.amountColumnB
        ? resolveIndex(template.amountColumnB, headersB, "Système B")
        : null,
      excludeHeaderRowsA: template.excludeHeaderRowsA,
      excludeHeaderRowsB: template.excludeHeaderRowsB,
      excludeFooterRowsA: template.excludeFooterRowsA,
      excludeFooterRowsB: template.excludeFooterRowsB,
      deduplication: template.deduplication,
    },
    warnings,
  };
}
```

**La comparaison des noms de colonnes doit être case-insensitive et trim** pour tolérer les variations mineures entre fichiers.

### Patterns existants à respecter

**Server Actions** — Pattern identique à Story 5.1 (`lib/actions/templates.ts:1-10`) :
```typescript
"use server";
const supabase = await createClient();
const { data, error: claimsError } = await supabase.auth.getClaims();
if (claimsError || !data?.claims) return { error: "Non authentifié" };
const userId = data.claims.sub;
```

**Format réponse** — `{ success: true, data: ... }` ou `{ success: false, error: "message" }`.

**Page serveur** — La page `/protected/templates/page.tsx` est un Server Component. Elle appelle directement `listTemplates()` et passe les données aux composants client enfants.

**Navigation** — Pattern existant dans `app/protected/layout.tsx:17-23` : lien `<Link>` avec classes `font-normal text-muted-foreground hover:text-foreground transition-colors`.

### Zod v4

Le projet utilise Zod v4 (`^4.3.6`). Pour accéder aux erreurs de validation, utiliser `.issues` au lieu de `.errors` :
```typescript
// ❌ Zod v3 (ancien)
parsed.error.errors[0].message
// ✅ Zod v4 (actuel)
parsed.error.issues[0].message
```

### Pré-remplissage du ConfigureStep

Le composant `ConfigureStep` (`components/reconcile/configure-step.tsx:60-75`) initialise ses states dans des `useState`. Pour le pré-remplissage :

1. Ajouter une prop optionnelle `initialConfig?: ReconciliationConfig` et `warnings?: string[]`
2. Initialiser les `useState` avec les valeurs de `initialConfig` si présent
3. Afficher les `warnings` en rouge sous les sélecteurs de colonnes

**ATTENTION** : Les `useState` avec valeur initiale ne se mettent PAS à jour si la prop change après le premier rendu. Utiliser `useEffect` ou passer une `key` pour forcer le re-render si le template change.

**Solution recommandée** : Passer `key={templateId ?? "default"}` sur le composant `ConfigureStep` pour forcer le re-mount quand un template est appliqué.

### Flow d'application d'un template

1. User clique "Utiliser ce modèle" sur `/protected/templates` → navigation vers `/protected/reconcile?template=<id>`
2. `page.tsx` lit le query param, charge le template via `getTemplate(id)`, stocke en state
3. User upload ses fichiers normalement
4. Quand il passe à l'étape configure, le composant `ConfigureStep` reçoit `initialConfig` (résultat de `fromTemplateConfig()`)
5. Si des colonnes manquent → warnings affichés en rouge
6. User peut corriger et lancer le rapprochement

### Chargement du template via query param

```typescript
// app/protected/reconcile/page.tsx
import { useSearchParams } from "next/navigation";
import { getTemplate } from "@/lib/actions/templates";
import { fromTemplateConfig } from "@/lib/types/template";

// Dans le composant :
const searchParams = useSearchParams();
const templateId = searchParams.get("template");

// Charger le template au mount si query param présent
useEffect(() => {
  if (templateId) {
    getTemplate(templateId).then((result) => {
      if (result.success && result.data) {
        setSelectedTemplate(result.data);
      }
    });
  }
}, [templateId]);

// Appliquer quand les fichiers sont parsés
// Dans le handleReconcile ou quand on passe à "configure" :
if (selectedTemplate && parsedA && parsedB) {
  const { config, warnings } = fromTemplateConfig(
    selectedTemplate.config,
    parsedA.headers,
    parsedB.headers
  );
  // Passer config et warnings au ConfigureStep
}
```

**Note** : `useSearchParams()` nécessite un `<Suspense>` boundary dans le parent. Le `page.tsx` est déjà un Client Component, ajouter `<Suspense>` si nécessaire.

### Page Templates (Server Component)

```typescript
// app/protected/templates/page.tsx
import { listTemplates } from "@/lib/actions/templates";
import { TemplateCard } from "@/components/reconcile/template-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function TemplatesPage() {
  const result = await listTemplates();
  // ...
}
```

### Composant TemplateCard

Afficher dans chaque carte :
- **Nom** du modèle (gras)
- **Description** (si présente, texte gris)
- **Date** de création (format `dd/mm/yyyy`)
- **Résumé config** : "X colonnes clés" + "Déduplication : Oui/Non"
- **Bouton** "Utiliser ce modèle" → `<Link href={/protected/reconcile?template=${id}}>`

### Fichiers à créer / modifier

| Action | Fichier | Raison |
|--------|---------|--------|
| MODIFY | `lib/actions/templates.ts` | Ajouter `listTemplates()`, `getTemplate()` |
| MODIFY | `lib/types/template.ts` | Ajouter `fromTemplateConfig()`, `ApplyTemplateResult` |
| CREATE | `app/protected/templates/page.tsx` | Page liste des templates |
| CREATE | `components/reconcile/template-card.tsx` | Carte template |
| MODIFY | `components/reconcile/configure-step.tsx` | Accepter `initialConfig` + `warnings` |
| MODIFY | `app/protected/reconcile/page.tsx` | Lire query param `template`, charger et appliquer template |
| MODIFY | `app/protected/layout.tsx` | Ajouter lien "Modèles" dans la nav |
| CREATE | `lib/types/template.test.ts` | Tests `fromTemplateConfig()` (ajouter aux tests existants) |

### Anti-patterns à éviter

- NE PAS utiliser `router.push` avec state — utiliser un query param `?template=<id>` (pattern URL-friendly, shareable)
- NE PAS charger le template côté client depuis le ConfigureStep — le charger dans `page.tsx` et passer en props
- NE PAS ignorer les colonnes manquantes silencieusement — les signaler explicitement à l'utilisateur
- NE PAS créer de route API — utiliser des Server Actions comme dans tout le projet
- NE PAS oublier le `key` prop sur ConfigureStep pour forcer le re-render avec les valeurs initiales du template

### Dépendances

- Aucune nouvelle dépendance nécessaire — tout est déjà installé (Supabase, Zod, shadcn, Next.js)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/architecture.md#Page Structure]
- [Source: lib/actions/templates.ts — Server Actions existantes (saveTemplate, upsertTemplate)]
- [Source: lib/types/template.ts — TemplateConfig, toTemplateConfig()]
- [Source: components/reconcile/configure-step.tsx — ConfigureStep component, useState initialization]
- [Source: app/protected/reconcile/page.tsx — ReconcilePage state management]
- [Source: app/protected/layout.tsx — Navigation pattern]
- [Source: Story 5.1 Dev Agent Record — Zod v4 uses .issues not .errors]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Page `/protected/templates` nécessite un Suspense boundary pour le data fetching (PPR Next.js 16)
- `useSearchParams()` dans reconcile/page.tsx nécessite un Suspense wrapper — composant séparé ReconcilePageInner

### Completion Notes List

- Task 1: Server Actions `listTemplates()` et `getTemplate()` ajoutées dans `lib/actions/templates.ts` avec mapping snake_case → camelCase
- Task 2: `fromTemplateConfig()` implémentée avec matching case-insensitive et trim, retourne warnings pour colonnes manquantes
- Task 3: Page `/protected/templates` créée avec Server Component + Suspense, état vide avec CTA, cartes avec résumé config
- Task 4: Page reconcile modifiée pour accepter `?template=<id>`, charger le template, et pré-remplir ConfigureStep. Warnings affichés en orange. Key prop pour forcer re-mount
- Task 5: Lien "Modèles" ajouté dans la nav à côté de "Rapprochement"
- Task 6: 10 tests ajoutés pour `fromTemplateConfig()` dont roundtrip, case-insensitive, whitespace trim, colonnes manquantes. Total 39 tests, 0 regression

### File List

- MODIFY `lib/actions/templates.ts` — ajout `listTemplates()`, `getTemplate()`
- MODIFY `lib/types/template.ts` — ajout `fromTemplateConfig()`, `ApplyTemplateResult`
- CREATE `app/protected/templates/page.tsx` — page liste des modèles
- CREATE `components/reconcile/template-card.tsx` — carte template
- MODIFY `components/reconcile/configure-step.tsx` — props `initialConfig`, `warnings`, pré-remplissage
- MODIFY `app/protected/reconcile/page.tsx` — query param template, chargement, application
- MODIFY `app/protected/layout.tsx` — lien "Modèles" dans la nav
- MODIFY `lib/types/template.test.ts` — 10 tests `fromTemplateConfig()` ajoutés

### Change Log

- 2026-02-18: Implémentation complète story 5.2 — liste et application des modèles (6 tasks, 10 nouveaux tests, 0 regression)

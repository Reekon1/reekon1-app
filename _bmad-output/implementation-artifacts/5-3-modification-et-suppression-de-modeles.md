# Story 5.3: Modification et Suppression de Modèles

Status: done

## Story

As a utilisateur ayant des modèles de rapprochement sauvegardés,
I want modifier le nom, la description d'un modèle existant, ou le supprimer,
so that je maintiens ma liste de modèles à jour et pertinente.

## Acceptance Criteria

1. **Given** l'utilisateur est sur la page `/protected/templates` et visualise ses modèles, **When** il clique sur "Modifier" sur une carte de modèle, **Then** il est redirigé vers la page de détail du modèle (`/protected/templates/[id]`). Un formulaire affiche les champs éditables : nom, description. Les champs sont pré-remplis avec les valeurs actuelles du modèle (FR38).

2. **Given** l'utilisateur modifie le nom ou la description et soumet le formulaire, **When** la Server Action de mise à jour est exécutée, **Then** les modifications sont enregistrées dans la table `reconciliation_templates`, le champ `updated_at` est mis à jour, un message de confirmation s'affiche : "Modèle mis à jour avec succès", et l'utilisateur est redirigé vers la liste des modèles.

3. **Given** l'utilisateur tente de soumettre un nom vide, **When** il soumet le formulaire, **Then** un message d'erreur s'affiche : "Le nom du modèle est obligatoire" (validation Zod).

4. **Given** l'utilisateur souhaite supprimer un modèle, **When** il clique sur "Supprimer" sur une carte, **Then** une boîte de dialogue de confirmation s'affiche : "Êtes-vous sûr de vouloir supprimer le modèle '{nom}' ? Cette action est irréversible."

5. **Given** l'utilisateur confirme la suppression, **When** la Server Action de suppression est exécutée, **Then** le modèle est supprimé (FR39), un message "Modèle supprimé" s'affiche, et la liste des modèles est rafraîchie.

6. **Given** l'utilisateur annule la suppression, **When** il clique sur "Annuler", **Then** rien ne se passe et le modèle reste inchangé.

## Tasks / Subtasks

- [x] Task 1 : Server Actions update/delete (AC: #2, #3, #5)
  - [x] 1.1 Ajouter `updateTemplate(id, { templateName, description })` dans `lib/actions/templates.ts`
  - [x] 1.2 Ajouter `deleteTemplate(id)` dans `lib/actions/templates.ts`

- [x] Task 2 : Page d'édition `/protected/templates/[id]` (AC: #1, #2, #3)
  - [x] 2.1 Créer `app/protected/templates/[id]/page.tsx` — page avec formulaire nom + description pré-rempli
  - [x] 2.2 Créer `components/reconcile/edit-template-form.tsx` — formulaire client avec validation Zod + soumission

- [x] Task 3 : Suppression depuis la carte (AC: #4, #5, #6)
  - [x] 3.1 Créer `components/reconcile/delete-template-dialog.tsx` — dialog de confirmation suppression
  - [x] 3.2 Intégrer boutons "Modifier" et "Supprimer" dans `TemplateCard`

- [x] Task 4 : Tests
  - [x] 4.1 Test unitaire schéma Zod `updateTemplateSchema` dans `lib/validators/template.test.ts`

## Dev Notes

### Server Actions pattern

Suivre exactement le pattern existant dans `lib/actions/templates.ts` :
```typescript
const supabase = await createClient();
const { data: authData, error: claimsError } = await supabase.auth.getClaims();
if (claimsError || !authData?.claims) return { success: false, error: "Non authentifié" };
```

### Update Server Action

```typescript
export async function updateTemplate(id: string, input: {
  templateName: string;
  description?: string;
}): Promise<SaveResult> {
  // Validation Zod
  // Auth check
  // Update where id = id (RLS ensures user_id match)
  // Set updated_at = now()
}
```

### Delete Server Action

```typescript
export async function deleteTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  // Auth check
  // Delete where id = id (RLS ensures user_id match)
}
```

### Page d'édition

La page `app/protected/templates/[id]/page.tsx` est un Server Component qui :
1. Charge le template via `getTemplate(id)` (déjà implémenté dans story 5.2)
2. Passe les données à un composant client `EditTemplateForm`
3. Affiche un résumé de la config (lecture seule — la config n'est pas éditable ici, seulement nom/description)

### Dialog de suppression

Utiliser le composant `AlertDialog` de shadcn/ui. Vérifier si `components/ui/alert-dialog.tsx` existe déjà — il existe (ajouté dans une story précédente).

### Zod v4

Le projet utilise Zod v4 (`^4.3.6`). Utiliser `.issues` au lieu de `.errors`.

### Validation schema update

Créer un schéma séparé pour l'update (pas besoin de config) :
```typescript
export const updateTemplateSchema = z.object({
  templateName: z.string().min(1, "Le nom du modèle est obligatoire").max(100),
  description: z.string().max(500).optional().default(""),
});
```

### Redirection après update

Utiliser `router.push("/protected/templates")` après succès dans le composant client, ou `redirect()` depuis la Server Action. Préférer `router.push` côté client pour permettre l'affichage du message de succès avant la redirection.

### Rafraîchissement après suppression

Utiliser `router.refresh()` après la suppression réussie pour rafraîchir la liste des templates côté serveur (revalide le Server Component).

### Fichiers à créer / modifier

| Action | Fichier | Raison |
|--------|---------|--------|
| MODIFY | `lib/actions/templates.ts` | Ajouter `updateTemplate()`, `deleteTemplate()` |
| MODIFY | `lib/validators/template.ts` | Ajouter `updateTemplateSchema` |
| CREATE | `app/protected/templates/[id]/page.tsx` | Page édition modèle |
| CREATE | `components/reconcile/edit-template-form.tsx` | Formulaire édition |
| CREATE | `components/reconcile/delete-template-dialog.tsx` | Dialog confirmation suppression |
| MODIFY | `components/reconcile/template-card.tsx` | Ajouter boutons Modifier/Supprimer |
| MODIFY | `lib/validators/template.test.ts` | Tests updateTemplateSchema |

### Anti-patterns à éviter

- NE PAS permettre l'édition de la config depuis cette page — seulement nom/description
- NE PAS oublier `router.refresh()` après suppression pour rafraîchir la liste Server Component
- NE PAS utiliser `revalidatePath` dans la Server Action — c'est le client qui refresh

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3]
- [Source: lib/actions/templates.ts — Server Actions existantes]
- [Source: components/reconcile/template-card.tsx — carte à modifier]
- [Source: components/ui/alert-dialog.tsx — composant existant]
- [Source: Story 5.1/5.2 Dev Agent Records — Zod v4, patterns établis]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Page `/protected/templates/[id]` requires Suspense boundary — `await params` is a dynamic data access in Next.js 16 PPR. Moved params resolution inside a Suspense-wrapped async component.

### Completion Notes List

- Task 1: `updateTemplate()` and `deleteTemplate()` Server Actions added to `lib/actions/templates.ts`, `updateTemplateSchema` added to `lib/validators/template.ts`
- Task 2: Edit page created at `app/protected/templates/[id]/page.tsx` with Suspense boundary for PPR, `EditTemplateForm` client component with Zod validation, success message, and redirect
- Task 3: `DeleteTemplateDialog` created using AlertDialog with confirmation message, loading state, and `router.refresh()` after deletion. TemplateCard updated with Modifier/Supprimer/Utiliser buttons.
- Task 4: 6 tests added for `updateTemplateSchema` — valid input, empty name, name too long, description too long, no config required. Total 45 tests, 0 regression.

### File List

- MODIFY `lib/actions/templates.ts` — ajout `updateTemplate()`, `deleteTemplate()`, `MutationResult` interface
- MODIFY `lib/validators/template.ts` — ajout `updateTemplateSchema`, `UpdateTemplateInput`
- CREATE `app/protected/templates/[id]/page.tsx` — page édition modèle avec Suspense
- CREATE `components/reconcile/edit-template-form.tsx` — formulaire édition nom/description
- CREATE `components/reconcile/delete-template-dialog.tsx` — dialog confirmation suppression
- MODIFY `components/reconcile/template-card.tsx` — boutons Modifier/Supprimer ajoutés
- MODIFY `lib/validators/template.test.ts` — 6 tests updateTemplateSchema

### Change Log

- 2026-02-18: Implémentation complète story 5.3 — modification et suppression de modèles (4 tasks, 6 nouveaux tests, 0 regression)

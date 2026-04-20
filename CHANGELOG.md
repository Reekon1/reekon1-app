# Changelog

## [0.2.0] - 2026-04-20

### Features
- feat: rapprochement manuel — chaque suggestion en deux lignes empilées (fichier A au-dessus, fichier B en dessous) avec colonnes serrées type Excel, source et similarité fusionnées

## [0.1.0] - 2026-04-19

### Features
- feat: séparateurs par gap dans les clés composées (ex. `col1-col2_col3`)
- feat: modal d'ajout/modification de clé simplifiée — clic direct sur une colonne pour l'ajouter/retirer, chips éditables entre les deux tableaux, aperçu texte en bas
- feat: rapprochement manuel converti en modal plein écran avec sélection persistante
- feat: diagnostics CSV détaillés (erreurs explicites, modal structurée, mise en évidence)
- feat: scope step unifié (1 tableau par fichier)
- feat: clés asymétriques (1:N), aperçus conditionnels, aperçu live

### Bug Fixes
- fix: encodage des accents dans le configuration step et les CSV
- fix: empêcher le rétrécissement du sélecteur de colonnes des clés
- fix: modal d'erreurs CSV plein écran — UX liste/détail en deux niveaux

### Internal
- refactor: `KeyMapping` accepte `separatorsA?` et `separatorsB?` (fallback sur `separator` pour rétrocompat templates)
- refactor: `buildKeyFromMappings` utilise les séparateurs par position si présents
- refactor: suppression du layer auth (admin client), migration Supabase associée

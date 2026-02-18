---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
status: complete
completedAt: '2026-02-17'
inputDocuments:
  - planning-artifacts/prd.md
  - planning-artifacts/architecture.md
  - sample-data/instructions.txt
---

# reekon - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for reekon, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Authentification & Compte Utilisateur:**
- FR1: L'utilisateur peut créer un compte avec son adresse email
- FR2: L'utilisateur peut se connecter via magic link (lien envoyé par email)
- FR3: L'utilisateur peut se déconnecter de son compte
- FR4: L'utilisateur peut supprimer son compte et toutes ses données

**Import de Fichiers:**
- FR5: L'utilisateur peut uploader un premier fichier (Système A)
- FR6: L'utilisateur peut uploader un second fichier (Système B)
- FR7: Le système peut accepter les formats xlsx, xls, csv et txt
- FR8: Le système peut détecter automatiquement le séparateur des fichiers CSV/TXT
- FR9: Le système peut détecter automatiquement l'encodage des fichiers
- FR10: L'utilisateur peut prévisualiser les données importées avant traitement

**Configuration du Rapprochement:**
- FR11: L'utilisateur peut sélectionner les colonnes à utiliser comme clé de rapprochement
- FR12: L'utilisateur peut créer une clé composite en combinant plusieurs colonnes
- FR13: L'utilisateur peut sélectionner la colonne de montant à comparer
- FR14: L'utilisateur peut définir les lignes à exclure (en-têtes, pieds de page)
- FR15: L'utilisateur peut activer/désactiver la déduplication automatique

**Traitement & Rapprochement:**
- FR16: Le système peut effectuer un rapprochement bidirectionnel entre les deux fichiers
- FR17: Le système peut identifier les correspondances exactes (clé identique)
- FR18: Le système peut identifier les écarts de montants (clé identique, montant différent)
- FR19: Le système peut identifier les lignes uniques Système A (absentes de B)
- FR20: Le système peut identifier les lignes uniques Système B (absentes de A)
- FR21: Le système peut dédupliquer les lignes basées sur la clé définie
- FR22: Le système peut calculer la variance entre les montants discordants

**Visualisation des Résultats:**
- FR23: L'utilisateur peut voir un dashboard de synthèse après traitement
- FR24: L'utilisateur peut voir le taux de correspondance global (%)
- FR25: L'utilisateur peut voir le nombre de correspondances, écarts et uniques
- FR26: L'utilisateur peut voir des indicateurs visuels colorés (vert/orange/rouge)
- FR27: L'utilisateur peut voir le détail des écarts de montants
- FR28: L'utilisateur peut voir le détail des lignes uniques par système

**Export & Rapports:**
- FR29: L'utilisateur peut télécharger un rapport Excel détaillé
- FR30: Le rapport contient un onglet pour les écarts Système A
- FR31: Le rapport contient un onglet pour les écarts Système B
- FR32: Le rapport contient une synthèse des métriques de rapprochement
- FR33: Le téléchargement du rapport se déclenche automatiquement à la fin du traitement

**Gestion des Modèles de Rapprochement:**
- FR34: L'utilisateur peut sauvegarder une configuration de rapprochement comme modèle
- FR35: L'utilisateur peut nommer et décrire un modèle sauvegardé
- FR36: L'utilisateur peut voir la liste de ses modèles sauvegardés
- FR37: L'utilisateur peut appliquer un modèle existant à un nouveau rapprochement
- FR38: L'utilisateur peut modifier un modèle existant
- FR39: L'utilisateur peut supprimer un modèle

**Conformité & Sécurité:**
- FR40: Le système détruit les fichiers uploadés immédiatement après traitement
- FR41: Le système ne conserve pas les rapports générés côté serveur
- FR42: Le système chiffre les données en transit (HTTPS/TLS)
- FR43: L'utilisateur peut accéder uniquement à ses propres modèles

### NonFunctional Requirements

**Performance:**
- NFR-P1: Temps de traitement rapprochement < 30 secondes pour fichiers ≤ 5000 lignes
- NFR-P2: Temps de chargement initial < 3 secondes (first contentful paint)
- NFR-P3: Temps d'upload fichier < 5 secondes pour fichiers ≤ 10 MB
- NFR-P4: Réactivité interface — feedback utilisateur < 200ms sur toute action

**Sécurité:**
- NFR-S1: Chiffrement transit HTTPS/TLS 1.3 obligatoire
- NFR-S2: Authentification magic link avec expiration < 15 minutes
- NFR-S3: Session utilisateur — expiration automatique après 24h d'inactivité
- NFR-S4: Isolation données — un utilisateur ne peut accéder qu'à ses propres modèles
- NFR-S5: Destruction fichiers uploadés < 1 seconde après traitement
- NFR-S6: Hébergement serveurs localisés en France (OVH)

**Fiabilité:**
- NFR-R1: Disponibilité MVP 99% uptime (hors maintenance planifiée)
- NFR-R2: Taux d'erreur traitement < 1% d'échecs système
- NFR-R3: Récupération erreur — message d'erreur clair + possibilité de réessayer

**Utilisabilité:**
- NFR-U1: Time-to-value — inscription → premier rapport < 10 minutes
- NFR-U2: Apprentissage — utilisateur complète un rapprochement sans aide dès le 1er essai
- NFR-U3: Lisibilité — contraste suffisant pour écrans de bureau standard
- NFR-U4: Responsive — fonctionnel sur écrans ≥ 1024px (desktop focus)

### Additional Requirements

**Starter Template (Architecture — impacte Epic 1 Story 1):**
- Initialisation avec `npx create-next-app@latest reekon --example with-supabase`
- Ajout shadcn/ui : `npx shadcn@latest init`
- Ajout Vitest + React Testing Library : `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths`

**Infrastructure & Déploiement:**
- Hébergement Vercel, region `cdg1` (Paris) pour latence France
- CI/CD Vercel Git Integration (auto-deploy main, preview deploys)
- Environnements : dev / preview / production
- `maxDuration: 60` sur la route API rapprochement

**Architecture Technique:**
- Supabase Auth cookie-based avec magic link (fourni par le starter)
- RLS `auth.uid() = user_id` sur la table `reconciliation_templates`
- Validation Zod client + serveur systématique (schéma partagé `lib/validators/`)
- Server Actions pour CRUD templates, API Route pour rapprochement
- Traitement 100% en mémoire — pipeline séquentiel : Parser → Normalizer → Engine → Report
- Normalisation encodage comme composant transversal
- Server Components par défaut, Client Components uniquement si interactivité requise

**Structure Projet:**
- Structure de répertoires complète définie dans l'architecture
- Tests co-localisés avec Vitest (`*.test.ts` à côté du source)
- Conventions de nommage : snake_case (DB), kebab-case (routes/fichiers), camelCase (JS/JSON), PascalCase (composants/types)
- Format réponse API standard : `{ success, data/error }` typé avec codes erreur

**Dépendances Techniques:**
- Parsing XLSX : `xlsx` ou `exceljs`
- Parsing CSV : `papaparse`
- Génération rapport Excel : `exceljs`
- Validation données : `zod`
- UI Components : `shadcn/ui`

**Insights des données échantillon (SAGE/ZEENDOC) :**
- Normalisation d'encodage inter-systèmes (caractères spéciaux, retours chariot dans Zeendoc absents de Sage)
- Correspondance codes fournisseur variables (code seul vs code-libellé, ex : `CNFFOKTOS` vs `CNFFOKTOS – OKTOS`)
- Valeur absolue obligatoire pour comparaison de montants (montants négatifs dans certains exports)
- Clé unique inter-système (Zeendoc col A "Identifiant" / Sage col AF "Id_dl") + clé reconstituée par concaténation (N° facture + Date + Code fournisseur + Montant)
- Formats de date potentiellement différents entre systèmes

### FR Coverage Map

- FR1: Epic 1 — Création de compte email
- FR2: Epic 1 — Connexion via magic link
- FR3: Epic 1 — Déconnexion
- FR4: Epic 1 — Suppression de compte
- FR5: Epic 2 — Upload fichier Système A
- FR6: Epic 2 — Upload fichier Système B
- FR7: Epic 2 — Support formats xlsx, xls, csv, txt
- FR8: Epic 2 — Détection automatique séparateur CSV/TXT
- FR9: Epic 2 — Détection automatique encodage
- FR10: Epic 2 — Prévisualisation données importées
- FR11: Epic 3 — Sélection colonnes clé de rapprochement
- FR12: Epic 3 — Création clé composite multi-colonnes
- FR13: Epic 3 — Sélection colonne montant
- FR14: Epic 3 — Exclusion lignes (en-têtes, pieds de page)
- FR15: Epic 3 — Activation/désactivation déduplication
- FR16: Epic 3 — Rapprochement bidirectionnel
- FR17: Epic 3 — Identification correspondances exactes
- FR18: Epic 3 — Identification écarts de montants
- FR19: Epic 3 — Identification lignes uniques Système A
- FR20: Epic 3 — Identification lignes uniques Système B
- FR21: Epic 3 — Déduplication par clé définie
- FR22: Epic 3 — Calcul variance montants discordants
- FR23: Epic 4 — Dashboard de synthèse
- FR24: Epic 4 — Taux de correspondance global
- FR25: Epic 4 — Nombre correspondances, écarts, uniques
- FR26: Epic 4 — Indicateurs visuels colorés (vert/orange/rouge)
- FR27: Epic 4 — Détail écarts de montants
- FR28: Epic 4 — Détail lignes uniques par système
- FR29: Epic 4 — Téléchargement rapport Excel
- FR30: Epic 4 — Onglet écarts Système A
- FR31: Epic 4 — Onglet écarts Système B
- FR32: Epic 4 — Synthèse métriques de rapprochement
- FR33: Epic 4 — Téléchargement automatique en fin de traitement
- FR34: Epic 5 — Sauvegarde configuration comme modèle
- FR35: Epic 5 — Nommage et description modèle
- FR36: Epic 5 — Liste des modèles sauvegardés
- FR37: Epic 5 — Application modèle existant
- FR38: Epic 5 — Modification modèle existant
- FR39: Epic 5 — Suppression modèle
- FR40: Epic 3 — Destruction fichiers post-traitement (RGPD)
- FR41: Epic 4 — Pas de conservation rapport côté serveur (RGPD)
- FR42: Epic 1 — Chiffrement données en transit (HTTPS/TLS)
- FR43: Epic 5 — Isolation données utilisateur (RLS)

## Epic List

### Epic 1 : Fondation du Projet & Authentification
L'utilisateur peut créer un compte, se connecter via magic link, et gérer son compte de manière sécurisée.
**FRs couvertes :** FR1, FR2, FR3, FR4, FR42

### Epic 2 : Import & Prévisualisation de Fichiers
L'utilisateur peut uploader des fichiers dans n'importe quel format d'export (xlsx, xls, csv, txt) et vérifier visuellement que ses données sont correctement interprétées.
**FRs couvertes :** FR5, FR6, FR7, FR8, FR9, FR10

### Epic 3 : Moteur de Rapprochement
L'utilisateur peut configurer ses clés de rapprochement (simples ou composites), appliquer des options de nettoyage, et lancer le rapprochement bidirectionnel entre ses deux fichiers.
**FRs couvertes :** FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR40

### Epic 4 : Dashboard Résultats & Export Excel
L'utilisateur peut visualiser un tableau de bord clair des résultats (correspondances, écarts, absents) et télécharger un rapport Excel détaillé prêt pour l'audit.
**FRs couvertes :** FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32, FR33, FR41

### Epic 5 : Gestion des Modèles de Rapprochement
L'utilisateur peut sauvegarder une configuration de rapprochement comme modèle réutilisable, la retrouver, la modifier, et l'appliquer à de futurs rapprochements.
**FRs couvertes :** FR34, FR35, FR36, FR37, FR38, FR39, FR43

## Epic 1 : Fondation du Projet & Authentification

L'utilisateur peut créer un compte, se connecter via magic link, et gérer son compte de manière sécurisée.

### Story 1.1 : Initialisation du Projet et Infrastructure

En tant que développeur,
Je veux initialiser le projet avec le starter template officiel et configurer l'outillage de développement,
Afin de disposer d'une base de code fonctionnelle, déployable et prête pour le développement des fonctionnalités.

**Acceptance Criteria:**

**Given** aucun projet n'existe encore
**When** le développeur exécute les commandes d'initialisation (`create-next-app --example with-supabase`, `shadcn init`, installation Vitest)
**Then** le projet Next.js démarre localement sans erreur avec `npm run dev`
**And** shadcn/ui est configuré et un composant Button peut être importé
**And** Vitest est configuré et un test trivial passe avec `npm run test`

**Given** le projet est initialisé localement
**When** le développeur connecte le repo Git à Vercel
**Then** le déploiement automatique fonctionne sur la region `cdg1` (Paris)
**And** HTTPS/TLS est actif par défaut (FR42)
**And** les variables d'environnement Supabase sont configurées (`.env.local` + Vercel Dashboard)

**Given** le projet est déployé sur Vercel
**When** un utilisateur accède à l'URL de production
**Then** la page s'affiche en moins de 3 secondes (NFR-P2)
**And** la connexion est sécurisée en HTTPS/TLS 1.3 (NFR-S1)

**Given** Supabase est configuré
**When** le développeur vérifie la connexion Supabase
**Then** le middleware Supabase Auth (refresh session cookie) est en place
**And** les variables d'environnement Supabase sont fonctionnelles (connexion DB OK)

### Story 1.2 : Inscription et Connexion via Code OTP Email

En tant qu'utilisateur,
Je veux m'inscrire ou me connecter en saisissant mon adresse email et en entrant un code à 6 chiffres reçu par email,
Afin d'accéder à l'application de manière simple et sécurisée sans mot de passe à retenir.

**Acceptance Criteria:**

**Given** un utilisateur non authentifié accède à l'application
**When** il est redirigé vers la page `/auth/login`
**Then** un formulaire affiche un champ email et un bouton "Recevoir le code"

**Given** l'utilisateur saisit une adresse email valide et soumet le formulaire
**When** Supabase envoie le code OTP par email
**Then** un écran de saisie du code à 6 chiffres s'affiche avec l'adresse email confirmée
**And** le code OTP expire après 1 heure (configurable dans Supabase)

**Given** l'utilisateur saisit une adresse email invalide
**When** il soumet le formulaire
**Then** un message d'erreur clair s'affiche

**Given** l'utilisateur saisit le code OTP correct
**When** la vérification Supabase Auth réussit (`verifyOtp`)
**Then** une session cookie est créée
**And** l'utilisateur est redirigé vers la page protégée
**And** si l'email n'existait pas, un nouveau compte est créé automatiquement (FR1)
**And** si l'email existait déjà, l'utilisateur est connecté à son compte existant (FR2)

**Given** l'utilisateur saisit un code OTP incorrect
**When** la vérification échoue
**Then** un message d'erreur s'affiche et l'utilisateur peut réessayer ou renvoyer un nouveau code

**Given** un utilisateur authentifié accède à une route protégée
**When** le proxy vérifie la session
**Then** l'accès est autorisé et la page s'affiche normalement

**Given** un utilisateur non authentifié tente d'accéder à une route protégée
**When** le proxy détecte l'absence de session valide
**Then** l'utilisateur est redirigé vers `/auth/login`

### Story 1.3 : Déconnexion

En tant qu'utilisateur connecté,
Je veux pouvoir me déconnecter de mon compte,
Afin de sécuriser mon accès lorsque j'ai terminé mon travail.

**Acceptance Criteria:**

**Given** un utilisateur est authentifié sur le dashboard
**When** il clique sur le bouton "Se déconnecter"
**Then** la session Supabase est détruite (cookie supprimé)
**And** l'utilisateur est redirigé vers la page `/login`
**And** toute tentative d'accès aux routes protégées redirige vers `/login`

**Given** un utilisateur s'est déconnecté
**When** il utilise le bouton "Retour" du navigateur
**Then** il ne peut pas accéder aux pages protégées et est redirigé vers `/login`

### Story 1.4 : Suppression de Compte et Données

En tant qu'utilisateur,
Je veux pouvoir supprimer mon compte et toutes mes données associées,
Afin d'exercer mon droit à l'effacement conformément au RGPD.

**Acceptance Criteria:**

**Given** un utilisateur authentifié accède à la page `/account`
**When** il clique sur "Supprimer mon compte"
**Then** une boîte de dialogue de confirmation s'affiche avec un avertissement sur l'irréversibilité de l'action

**Given** l'utilisateur confirme la suppression
**When** la Server Action de suppression est exécutée
**Then** tous les modèles de rapprochement de l'utilisateur sont supprimés de la table `reconciliation_templates`
**And** le compte utilisateur est supprimé de Supabase Auth
**And** la session est détruite
**And** l'utilisateur est redirigé vers la page `/login` avec un message "Votre compte a été supprimé"

**Given** l'utilisateur annule la suppression dans la boîte de dialogue
**When** il clique sur "Annuler"
**Then** rien ne se passe et il reste sur la page `/account`

## Epic 2 : Import & Prévisualisation de Fichiers

L'utilisateur peut uploader des fichiers dans n'importe quel format d'export (xlsx, xls, csv, txt) et vérifier visuellement que ses données sont correctement interprétées.

### Story 2.1 : Upload de Deux Fichiers

En tant qu'utilisateur,
Je veux pouvoir uploader deux fichiers (Système A et Système B) dans les formats xlsx, xls, csv ou txt,
Afin de fournir les données sources nécessaires au rapprochement.

**Acceptance Criteria:**

**Given** un utilisateur authentifié accède à la page `/reconcile`
**When** la page s'affiche
**Then** deux zones d'upload distinctes sont visibles : "Fichier Système A" et "Fichier Système B"
**And** chaque zone supporte le drag & drop et la sélection via un bouton "Parcourir"

**Given** l'utilisateur glisse ou sélectionne un fichier au format xlsx, xls, csv ou txt
**When** le fichier est déposé dans une zone d'upload
**Then** le nom du fichier, son format et sa taille s'affichent dans la zone
**And** un indicateur visuel confirme que le fichier est accepté (FR5, FR6, FR7)
**And** l'upload s'effectue en moins de 5 secondes pour un fichier ≤ 10 MB (NFR-P3)

**Given** l'utilisateur tente d'uploader un fichier dans un format non supporté (ex : .pdf, .docx)
**When** le fichier est déposé
**Then** un message d'erreur clair s'affiche : "Format non supporté. Formats acceptés : xlsx, xls, csv, txt"
**And** le fichier est rejeté (validation Zod côté client)

**Given** l'utilisateur tente d'uploader un fichier de plus de 10 MB
**When** le fichier est déposé
**Then** un message d'erreur s'affiche : "Fichier trop volumineux. Taille maximale : 10 MB"
**And** le fichier est rejeté

**Given** l'utilisateur a uploadé un fichier dans une zone
**When** il clique sur le bouton de suppression (croix) sur le fichier
**Then** le fichier est retiré et la zone revient à son état initial

**Given** l'utilisateur a uploadé un fichier côté client
**When** le fichier est envoyé au serveur
**Then** la validation serveur (Zod) re-vérifie le format MIME, l'extension et la taille
**And** un fichier invalide côté serveur retourne une erreur typée `VALIDATION_ERROR`

### Story 2.2 : Parsing Intelligent Multi-Format

En tant qu'utilisateur,
Je veux que le système détecte automatiquement le séparateur et l'encodage de mes fichiers,
Afin de ne pas avoir à configurer manuellement ces paramètres techniques.

**Acceptance Criteria:**

**Given** un fichier xlsx ou xls est uploadé
**When** le parser traite le fichier en mémoire (`lib/reconciliation/parser.ts`)
**Then** les données sont extraites correctement avec les noms de colonnes de la première ligne
**And** les types de données sont préservés (texte, nombres, dates)

**Given** un fichier CSV est uploadé avec un séparateur virgule
**When** le parser traite le fichier
**Then** le séparateur virgule est détecté automatiquement (FR8)
**And** les données sont correctement découpées en colonnes

**Given** un fichier CSV est uploadé avec un séparateur point-virgule
**When** le parser traite le fichier
**Then** le séparateur point-virgule est détecté automatiquement (FR8)
**And** les données sont correctement découpées en colonnes

**Given** un fichier TXT tabulé est uploadé
**When** le parser traite le fichier
**Then** le séparateur tabulation est détecté automatiquement (FR8)

**Given** un fichier est encodé en UTF-8
**When** le parser traite le fichier
**Then** les caractères spéciaux (accents, symboles) sont correctement interprétés (FR9)

**Given** un fichier est encodé en ISO-8859-1 (Latin-1) ou Windows-1252
**When** le parser traite le fichier
**Then** l'encodage est détecté automatiquement et les caractères sont correctement convertis (FR9)
**And** les retours chariot hétérogènes (CR, LF, CRLF) sont normalisés

**Given** un fichier est illisible ou corrompu
**When** le parser tente de le traiter
**Then** une erreur typée `PARSE_ERROR` est retournée avec un message clair : "Impossible de lire le fichier. Vérifiez le format." (NFR-R3)

**Given** le parser traite un fichier
**When** le traitement est terminé
**Then** les données restent uniquement en mémoire — aucun fichier intermédiaire n'est écrit sur disque

### Story 2.3 : Prévisualisation des Données Importées

En tant qu'utilisateur,
Je veux prévisualiser les données importées de chaque fichier avant de configurer le rapprochement,
Afin de vérifier que mes fichiers sont correctement interprétés et d'identifier les colonnes pertinentes.

**Acceptance Criteria:**

**Given** les deux fichiers ont été uploadés et parsés avec succès
**When** l'étape de prévisualisation s'affiche
**Then** un tableau de prévisualisation est affiché pour chaque fichier (Système A et Système B)
**And** chaque tableau affiche les noms de colonnes détectés en en-tête
**And** les 10 premières lignes de données sont visibles (FR10)

**Given** un fichier contient plus de 10 colonnes
**When** le tableau de prévisualisation s'affiche
**Then** un scroll horizontal permet de voir toutes les colonnes
**And** le nombre total de colonnes et de lignes est affiché (ex : "150 lignes × 12 colonnes")

**Given** les données prévisualisées sont correctes
**When** l'utilisateur clique sur "Continuer"
**Then** il est dirigé vers l'étape suivante de configuration du rapprochement

**Given** les données prévisualisées semblent incorrectes (mauvais encodage, mauvais séparateur)
**When** l'utilisateur clique sur "Re-uploader"
**Then** il peut remplacer le fichier concerné et relancer le parsing

**Given** le parsing d'un des deux fichiers a échoué
**When** l'étape de prévisualisation s'affiche
**Then** un message d'erreur clair est affiché pour le fichier en erreur
**And** l'utilisateur peut re-uploader uniquement le fichier en erreur

## Epic 3 : Moteur de Rapprochement

L'utilisateur peut configurer ses clés de rapprochement (simples ou composites), appliquer des options de nettoyage, et lancer le rapprochement bidirectionnel entre ses deux fichiers.

### Story 3.1 : Configuration des Colonnes et Clés de Rapprochement

En tant qu'utilisateur,
Je veux sélectionner les colonnes à utiliser comme clé de rapprochement et la colonne de montant à comparer,
Afin de définir précisément les critères de correspondance entre mes deux fichiers.

**Acceptance Criteria:**

**Given** l'utilisateur a validé la prévisualisation de ses deux fichiers (Epic 2)
**When** l'étape de configuration s'affiche (`/reconcile/configure`)
**Then** les listes de colonnes détectées de chaque fichier (Système A et Système B) sont affichées
**And** l'utilisateur peut sélectionner une colonne de chaque fichier pour constituer une paire de rapprochement (FR11)

**Given** l'utilisateur souhaite utiliser une clé simple (une seule colonne)
**When** il sélectionne une colonne dans Système A et une colonne dans Système B
**Then** la paire de colonnes est affichée comme clé de rapprochement active
**And** un aperçu des premières valeurs de chaque colonne est visible pour vérification

**Given** l'utilisateur souhaite créer une clé composite
**When** il clique sur "Ajouter une colonne à la clé"
**Then** il peut sélectionner des colonnes supplémentaires pour chaque fichier (FR12)
**And** la clé composite est affichée sous forme de concaténation ordonnée (ex : "N° facture + Date + Montant")
**And** il peut réordonner ou supprimer les colonnes de la clé composite

**Given** l'utilisateur souhaite comparer des montants
**When** il sélectionne une colonne de montant pour Système A et une pour Système B
**Then** les colonnes de montant sont marquées distinctement de la clé de rapprochement (FR13)
**And** un aperçu des premières valeurs de montant est affiché

**Given** l'utilisateur n'a sélectionné aucune colonne clé
**When** il tente de passer à l'étape suivante
**Then** un message d'erreur s'affiche : "Veuillez sélectionner au moins une colonne clé pour chaque fichier"

**Given** l'utilisateur a complété la configuration des clés
**When** la configuration est validée
**Then** la validation Zod vérifie la cohérence (au moins une paire de colonnes, colonnes existantes dans les fichiers)
**And** le feedback est immédiat < 200ms (NFR-P4)

### Story 3.2 : Options de Nettoyage et Déduplication

En tant qu'utilisateur,
Je veux pouvoir exclure des lignes parasites et activer la déduplication automatique,
Afin d'obtenir un rapprochement précis sur des données propres.

**Acceptance Criteria:**

**Given** l'utilisateur est sur la page de configuration du rapprochement
**When** la section "Options de nettoyage" s'affiche
**Then** il peut définir le nombre de lignes d'en-tête à ignorer pour chaque fichier (FR14)
**And** il peut définir le nombre de lignes de pied de page à ignorer pour chaque fichier (FR14)
**And** les valeurs par défaut sont : 0 lignes d'en-tête supplémentaires, 0 lignes de pied de page

**Given** l'utilisateur définit 2 lignes d'en-tête à exclure pour le Système A
**When** la prévisualisation se met à jour
**Then** les 2 premières lignes de données sont grisées ou retirées de l'aperçu
**And** le compteur de lignes est mis à jour en conséquence

**Given** l'utilisateur visualise les options de déduplication
**When** la section "Déduplication" s'affiche
**Then** une option "Dédupliquer les lignes ayant la même clé" est visible avec un toggle activé/désactivé (FR15)
**And** la déduplication est désactivée par défaut

**Given** l'utilisateur active la déduplication
**When** il active le toggle
**Then** un message informatif s'affiche : "Les lignes en double basées sur la clé définie seront regroupées"
**And** le nombre de doublons détectés par fichier est affiché en prévisualisation

**Given** l'utilisateur a configuré les options de nettoyage et déduplication
**When** il clique sur "Lancer le rapprochement"
**Then** la configuration complète (clés, montant, exclusions, déduplication) est envoyée à l'API Route `/api/reconcile`

### Story 3.3 : Moteur de Rapprochement Bidirectionnel

En tant qu'utilisateur,
Je veux que le système effectue un rapprochement bidirectionnel entre mes deux fichiers et catégorise chaque ligne,
Afin d'obtenir une vue complète des correspondances, écarts et anomalies entre mes deux systèmes.

**Acceptance Criteria:**

**Given** l'utilisateur a lancé le rapprochement avec une configuration valide
**When** l'API Route `/api/reconcile` reçoit les deux fichiers et la configuration
**Then** le pipeline s'exécute en mémoire : parsing → normalisation → rapprochement → résultats (FR16)
**And** le traitement s'effectue en moins de 30 secondes pour des fichiers ≤ 5000 lignes (NFR-P1)
**And** un indicateur de chargement est affiché côté client pendant le traitement

**Given** le normalizer traite les données avant rapprochement
**When** les valeurs des clés sont comparées
**Then** l'encodage est normalisé (suppression retours chariot, normalisation caractères spéciaux)
**And** les espaces superflus sont supprimés (trim)
**And** les montants sont convertis en valeur absolue pour la comparaison
**And** les codes fournisseur sont comparés sur la partie code uniquement (avant le tiret/séparateur si format code-libellé)

**Given** le moteur effectue le rapprochement bidirectionnel
**When** une ligne de Système A a une clé identique dans Système B et un montant identique
**Then** la ligne est catégorisée comme "Correspondance exacte" (FR17)

**Given** le moteur effectue le rapprochement bidirectionnel
**When** une ligne de Système A a une clé identique dans Système B mais un montant différent
**Then** la ligne est catégorisée comme "Écart de montant" (FR18)
**And** la variance est calculée : montant Système A - montant Système B (FR22)

**Given** le moteur effectue le rapprochement bidirectionnel
**When** une ligne de Système A n'a aucune correspondance de clé dans Système B
**Then** la ligne est catégorisée comme "Unique Système A" (FR19)

**Given** le moteur effectue le rapprochement bidirectionnel
**When** une ligne de Système B n'a aucune correspondance de clé dans Système A
**Then** la ligne est catégorisée comme "Unique Système B" (FR20)

**Given** la déduplication est activée
**When** plusieurs lignes d'un fichier partagent la même clé
**Then** les doublons sont regroupés et seule une ligne représentative est utilisée pour le rapprochement (FR21)
**And** le nombre de doublons détectés est inclus dans les résultats

**Given** le traitement est terminé avec succès
**When** les résultats sont prêts
**Then** la réponse JSON contient : `{ success: true, data: { summary, matches, amountVariances, uniqueA, uniqueB } }`
**And** les fichiers source en mémoire sont libérés (garbage collection fin de requête) (FR40)
**And** la destruction effective intervient en moins de 1 seconde après la réponse (NFR-S5)

**Given** une erreur survient pendant le traitement
**When** le moteur détecte un problème (colonne manquante, données incompatibles)
**Then** une erreur typée `RECONCILIATION_ERROR` est retournée avec un message explicite (NFR-R3)
**And** les fichiers en mémoire sont libérés malgré l'erreur
**And** l'utilisateur peut corriger sa configuration et relancer le rapprochement

## Epic 4 : Dashboard Résultats & Export Excel

L'utilisateur peut visualiser un tableau de bord clair des résultats (correspondances, écarts, absents) et télécharger un rapport Excel détaillé prêt pour l'audit.

### Story 4.1 : Dashboard de Synthèse des Résultats

En tant qu'utilisateur,
Je veux voir un tableau de bord synthétique après le rapprochement avec le taux de correspondance et des indicateurs visuels clairs,
Afin de comprendre immédiatement la qualité du rapprochement entre mes deux systèmes.

**Acceptance Criteria:**

**Given** le moteur de rapprochement a terminé le traitement avec succès (Epic 3)
**When** la page de résultats s'affiche (`/reconcile/results`)
**Then** un dashboard de synthèse est visible avec les métriques principales (FR23)
**And** le taux de correspondance global est affiché en pourcentage (FR24)
**And** le nombre de correspondances exactes, d'écarts de montants, de lignes uniques Système A et de lignes uniques Système B sont affichés (FR25)

**Given** le dashboard affiche les métriques
**When** l'utilisateur visualise les indicateurs
**Then** les correspondances exactes sont affichées en vert (FR26)
**And** les écarts de montants sont affichés en orange (FR26)
**And** les lignes uniques (absentes d'un système) sont affichées en rouge (FR26)

**Given** le taux de correspondance est élevé (≥ 90%)
**When** le dashboard s'affiche
**Then** l'indicateur principal est vert avec un message positif

**Given** le taux de correspondance est moyen (50-89%)
**When** le dashboard s'affiche
**Then** l'indicateur principal est orange avec un message d'attention

**Given** le taux de correspondance est faible (< 50%)
**When** le dashboard s'affiche
**Then** l'indicateur principal est rouge avec un message d'alerte

**Given** le dashboard est affiché
**When** l'utilisateur interagit avec la page
**Then** le feedback est immédiat < 200ms (NFR-P4)
**And** la page est fonctionnelle sur écrans ≥ 1024px (NFR-U4)

### Story 4.2 : Tableaux de Détail des Écarts et Lignes Uniques

En tant qu'utilisateur,
Je veux voir le détail des écarts de montants et des lignes uniques par système,
Afin d'identifier précisément les anomalies à investiguer ou à régulariser.

**Acceptance Criteria:**

**Given** le dashboard de synthèse est affiché (Story 4.1)
**When** l'utilisateur consulte la section "Écarts de montants"
**Then** un tableau affiche toutes les lignes ayant une clé identique mais un montant différent entre Système A et Système B (FR27)
**And** chaque ligne affiche : la clé de rapprochement, le montant Système A, le montant Système B, et la variance calculée
**And** les lignes sont triées par variance décroissante (plus gros écarts en premier)

**Given** le tableau des écarts de montants est affiché
**When** l'utilisateur consulte une ligne d'écart
**Then** la variance est clairement visible (montant A − montant B) avec signe positif ou négatif
**And** le montant total des variances est affiché en pied de tableau

**Given** le dashboard de synthèse est affiché
**When** l'utilisateur consulte la section "Lignes uniques Système A"
**Then** un tableau affiche toutes les lignes de Système A absentes de Système B (FR28)
**And** chaque ligne affiche les données source complètes (toutes les colonnes du fichier original)

**Given** le dashboard de synthèse est affiché
**When** l'utilisateur consulte la section "Lignes uniques Système B"
**Then** un tableau affiche toutes les lignes de Système B absentes de Système A (FR28)
**And** chaque ligne affiche les données source complètes

**Given** un tableau de détail contient plus de 20 lignes
**When** le tableau s'affiche
**Then** une pagination ou un scroll vertical permet de parcourir toutes les lignes
**And** le nombre total de lignes est affiché (ex : "28 écarts de montants")

**Given** un tableau de détail contient de nombreuses colonnes
**When** le tableau s'affiche
**Then** un scroll horizontal permet de voir toutes les colonnes
**And** la colonne clé et la colonne montant restent visibles (sticky) lors du scroll

### Story 4.3 : Génération et Téléchargement du Rapport Excel

En tant qu'utilisateur,
Je veux télécharger un rapport Excel détaillé contenant la synthèse et les écarts par système,
Afin de disposer d'un document exploitable pour l'audit, le partage avec mes collègues ou la communication client.

**Acceptance Criteria:**

**Given** les résultats du rapprochement sont affichés sur le dashboard (Story 4.1)
**When** le traitement se termine
**Then** le téléchargement du rapport Excel se déclenche automatiquement (FR33)
**And** un bouton "Télécharger le rapport" est également visible pour re-télécharger

**Given** le rapport Excel est généré (`lib/reconciliation/report.ts` via `exceljs`)
**When** l'utilisateur ouvre le fichier téléchargé
**Then** le rapport contient un onglet "Synthèse" avec les métriques globales : taux de correspondance, nombre de correspondances, nombre d'écarts, nombre de lignes uniques par système (FR32)
**And** le rapport contient un onglet "Écarts Système A" listant toutes les lignes avec écart de montant ou absentes côté B (FR30)
**And** le rapport contient un onglet "Écarts Système B" listant toutes les lignes avec écart de montant ou absentes côté A (FR31)

**Given** l'onglet "Écarts Système A" est ouvert
**When** l'utilisateur consulte les données
**Then** chaque ligne affiche : la clé de rapprochement, toutes les colonnes source, le statut (écart montant / absent de B), et la variance si applicable
**And** les lignes sont formatées avec des couleurs cohérentes (orange pour écarts de montant, rouge pour absents)

**Given** l'onglet "Écarts Système B" est ouvert
**When** l'utilisateur consulte les données
**Then** le même format que l'onglet "Écarts Système A" est appliqué avec les données de Système B

**Given** le rapport est généré côté serveur dans l'API Route
**When** le buffer Excel est prêt
**Then** le rapport est encodé en base64 dans la réponse JSON et décodé côté client pour le téléchargement
**And** aucune copie du rapport n'est conservée côté serveur (FR41)
**And** le fichier est nommé avec un format explicite : `rapprochement-{date}-{heure}.xlsx`

**Given** le rapport doit être re-téléchargé
**When** l'utilisateur clique sur le bouton "Télécharger le rapport"
**Then** le même fichier Excel est re-téléchargé depuis les données en mémoire côté client
**And** si l'utilisateur quitte la page, les données sont perdues (conformité RGPD, pas de persistance)

## Epic 5 : Gestion des Modèles de Rapprochement

L'utilisateur peut sauvegarder une configuration de rapprochement comme modèle réutilisable, la retrouver, la modifier, et l'appliquer à de futurs rapprochements.

### Story 5.1 : Sauvegarde d'un Modèle de Rapprochement

En tant qu'utilisateur,
Je veux pouvoir sauvegarder la configuration de mon rapprochement actuel comme modèle réutilisable avec un nom et une description,
Afin de ne pas reconfigurer manuellement les mêmes paramètres pour des rapprochements récurrents.

**Acceptance Criteria:**

**Given** l'utilisateur est sur la page de résultats après un rapprochement réussi (Epic 4)
**When** il clique sur "Sauvegarder comme modèle"
**Then** un formulaire s'affiche avec un champ "Nom du modèle" (obligatoire) et un champ "Description" (optionnel) (FR35)

**Given** cette story est la première à nécessiter la persistance de données
**When** le développeur implémente la sauvegarde de modèles
**Then** une migration Supabase (`supabase/migrations/00001_create_templates.sql`) est créée avec la table `reconciliation_templates` : `id`, `user_id`, `template_name`, `description`, `config` (jsonb), `created_at`, `updated_at`
**And** les politiques RLS sont activées : `auth.uid() = user_id` sur SELECT, INSERT, UPDATE, DELETE
**And** un index est créé sur `user_id` pour les performances

**Given** l'utilisateur remplit le nom du modèle et soumet le formulaire
**When** la Server Action de sauvegarde est exécutée
**Then** la configuration complète est sauvegardée dans la table `reconciliation_templates` : colonnes clés (simples ou composites) pour chaque fichier, colonne montant pour chaque fichier, options de nettoyage (lignes exclues), option de déduplication (FR34)
**And** le `user_id` est automatiquement associé via `auth.uid()` (RLS)
**And** un message de confirmation s'affiche : "Modèle sauvegardé avec succès"

**Given** l'utilisateur tente de sauvegarder un modèle sans nom
**When** il soumet le formulaire
**Then** un message d'erreur s'affiche : "Le nom du modèle est obligatoire" (validation Zod client + serveur)

**Given** l'utilisateur tente de sauvegarder un modèle avec un nom déjà utilisé
**When** il soumet le formulaire
**Then** un message d'avertissement s'affiche proposant de renommer ou d'écraser le modèle existant

**Given** la sauvegarde est en cours
**When** la Server Action s'exécute
**Then** un indicateur de chargement est affiché
**And** le feedback est immédiat < 200ms après la complétion (NFR-P4)

### Story 5.2 : Liste et Application des Modèles Sauvegardés

En tant qu'utilisateur,
Je veux voir la liste de mes modèles sauvegardés et pouvoir en appliquer un à un nouveau rapprochement,
Afin de gagner du temps en réutilisant une configuration déjà éprouvée.

**Acceptance Criteria:**

**Given** un utilisateur authentifié accède à la page `/templates`
**When** la page s'affiche
**Then** la liste de ses modèles sauvegardés est affichée sous forme de cartes (FR36)
**And** chaque carte affiche : le nom du modèle, la description, la date de création, et un résumé de la configuration (nombre de colonnes clés, déduplication activée ou non)
**And** seuls les modèles de l'utilisateur connecté sont visibles (FR43, RLS `auth.uid() = user_id`)

**Given** l'utilisateur n'a aucun modèle sauvegardé
**When** la page `/templates` s'affiche
**Then** un message s'affiche : "Aucun modèle sauvegardé. Effectuez un rapprochement et sauvegardez la configuration pour la réutiliser."
**And** un bouton "Nouveau rapprochement" redirige vers `/reconcile`

**Given** l'utilisateur a des modèles sauvegardés et souhaite en appliquer un
**When** il clique sur "Utiliser ce modèle" sur une carte
**Then** il est redirigé vers le wizard de rapprochement (`/reconcile`) à l'étape d'upload
**And** après l'upload et le parsing des fichiers, la configuration du modèle est pré-remplie automatiquement à l'étape de configuration (FR37)
**And** les colonnes clés, la colonne montant, les options de nettoyage et la déduplication sont restaurées depuis le modèle

**Given** un modèle est appliqué mais les fichiers uploadés n'ont pas les mêmes colonnes que lors de la sauvegarde
**When** l'étape de configuration s'affiche avec le modèle pré-rempli
**Then** les colonnes manquantes sont signalées en rouge avec un message : "Colonne '{nom}' non trouvée dans le fichier"
**And** l'utilisateur peut corriger manuellement le mapping avant de lancer le rapprochement

**Given** un autre utilisateur tente d'accéder aux modèles via l'API
**When** la requête est exécutée
**Then** les politiques RLS de Supabase bloquent l'accès aux modèles d'un autre utilisateur (FR43, NFR-S4)

### Story 5.3 : Modification et Suppression de Modèles

En tant qu'utilisateur,
Je veux pouvoir modifier le nom, la description ou la configuration d'un modèle existant, ou le supprimer,
Afin de maintenir ma liste de modèles à jour et pertinente.

**Acceptance Criteria:**

**Given** l'utilisateur est sur la page `/templates` et visualise ses modèles
**When** il clique sur "Modifier" sur une carte de modèle
**Then** il est redirigé vers la page de détail du modèle (`/templates/[id]`) (FR38)
**And** un formulaire affiche les champs éditables : nom, description, et un résumé de la configuration
**And** les champs sont pré-remplis avec les valeurs actuelles du modèle

**Given** l'utilisateur modifie le nom ou la description et soumet le formulaire
**When** la Server Action de mise à jour est exécutée
**Then** les modifications sont enregistrées dans la table `reconciliation_templates`
**And** le champ `updated_at` est mis à jour
**And** un message de confirmation s'affiche : "Modèle mis à jour avec succès"
**And** l'utilisateur est redirigé vers la liste des modèles

**Given** l'utilisateur tente de soumettre un nom vide
**When** il soumet le formulaire
**Then** un message d'erreur s'affiche : "Le nom du modèle est obligatoire" (validation Zod)

**Given** l'utilisateur souhaite supprimer un modèle
**When** il clique sur "Supprimer" sur une carte ou sur la page de détail
**Then** une boîte de dialogue de confirmation s'affiche : "Êtes-vous sûr de vouloir supprimer le modèle '{nom}' ? Cette action est irréversible."

**Given** l'utilisateur confirme la suppression
**When** la Server Action de suppression est exécutée
**Then** le modèle est supprimé de la table `reconciliation_templates` (FR39)
**And** un message de confirmation s'affiche : "Modèle supprimé"
**And** la liste des modèles est rafraîchie

**Given** l'utilisateur annule la suppression
**When** il clique sur "Annuler" dans la boîte de dialogue
**Then** rien ne se passe et le modèle reste inchangé

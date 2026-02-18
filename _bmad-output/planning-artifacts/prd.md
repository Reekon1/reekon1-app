---
stepsCompleted: [step-01-init, step-02-discovery, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
status: complete
completedAt: 2026-02-01
inputDocuments:
  - product-brief-reekon-2026-01-29.md
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 0
classification:
  projectType: saas_b2b
  domain: comptabilité/finance
  complexity: medium
  projectContext: greenfield
workflowType: 'prd'
date: 2026-01-29
author: reekon
---

# Product Requirements Document - reekon

**Author:** reekon
**Date:** 2026-01-29

## Executive Summary

**Reekon** est un service SaaS de rapprochement universel destiné aux comptables, experts-comptables et DAF.

**Problème:** Les professionnels comptables passent plusieurs jours par an à effectuer des rapprochements manuels sous Excel entre systèmes hétérogènes (exports ERP, relevés bancaires, fichiers tiers). Ce travail fastidieux génère des erreurs et expose l'entreprise à des risques lors des audits.

**Solution:** Un moteur de rapprochement agnostique qui ingère n'importe quel format d'export (xlsx, xls, csv, txt), permet de définir des clés de rapprochement simples ou composites, et génère un rapport clair avec les écarts identifiés — en quelques minutes plutôt qu'en plusieurs jours.

**Différenciateurs clés:**
- Agnosticisme total (compatible tout export, aucune intégration requise)
- Simplicité radicale (conçu pour comptables, pas data analysts)
- Conformité RGPD (données éphémères, hébergement France)

**Cible MVP:** 10 utilisateurs réguliers à 3 mois, validation produit-marché.

**Contrainte:** Développement par un solo développeur junior.

## Success Criteria

### User Success

| Critère | Indicateur | Objectif |
|---------|------------|----------|
| Gain de temps | Temps de rapprochement avant/après | Réduction de 80% (2 jours → 2h) |
| Vitesse perçue | Temps de traitement ressenti | "Effet waouh" — < 1 min pour un travail d'une journée |
| Clarté du rapport | Compréhension immédiate des écarts | Aucune recherche manuelle nécessaire |
| Fiabilité perçue | NPS / CSAT | NPS > 30, CSAT > 4/5 |
| Adoption récurrente | Fréquence d'usage | ≥ 1 rapprochement/mois |
| Rétention | Retour après premier usage | > 70% dans les 30 jours |

### Business Success

| Horizon | Objectif | Indicateur |
|---------|----------|------------|
| 3 mois | Validation produit-marché | 10 utilisateurs réguliers |
| 6 mois | Croissance organique | Acquisition par bouche-à-oreille |
| 12 mois | Rentabilité | Revenus couvrant les coûts opérationnels |

### Technical Success

| Critère | Objectif |
|---------|----------|
| Time-to-value | < 10 min (inscription → premier rapport) |
| Performance | < 30s pour fichiers ≤ 5000 lignes |
| Fiabilité | Taux d'erreur système < 1% |
| Taux de complétion | % d'utilisateurs terminant un rapprochement après upload |

### Measurable Outcomes

- **5 utilisateurs pilotes** réalisent un rapprochement complet sans assistance
- **Retour positif** sur la clarté du rapport généré
- **Support effectif** des 4 formats de fichiers (xlsx, xls, csv, txt)

## Product Scope

### MVP - Minimum Viable Product

- Authentification magic link
- Upload multi-formats (xlsx, xls, csv, txt)
- Parsing intelligent avec détection de séparateur
- Mapping manuel des colonnes pivots + clés composites
- Nettoyage paramétrable et déduplication
- Rapprochement bidirectionnel avec analyse de variance
- Dashboard de synthèse (taux de correspondance, alertes visuelles)
- Rapport Excel détaillé (écarts Système A / Système B)
- Conformité RGPD (données éphémères, destruction immédiate)
- Modèles de rapprochement sauvegardés

### Growth Features (Post-MVP / V2)

- Assistant IA pour suggestion de clés
- SSO entreprise (Google, Microsoft)
- Gestion des abonnements (Stripe)
- Historique des analyses

### Vision (Future / V3+)

- Intégrations ERP directes
- API pour automatisation
- Multi-utilisateurs par compte
- Expansion internationale
- Marketplace de connecteurs

## User Journeys

### Journey 1: Marie — "Le rapprochement de fin d'année"

**Persona:** Marie, 52 ans, comptable en ETI industrielle depuis 25 ans. Résistante au changement, experte Excel.

**Opening Scene:**
C'est le 15 janvier. Marie reçoit un email du DAF: "Le commissaire aux comptes passe dans 10 jours, il me faut le rapprochement fournisseurs/comptabilité avant vendredi." Elle soupire. L'année dernière, ça lui avait pris 3 jours entiers — copier-coller, RECHERCHEV, vérifications ligne par ligne. Son dos s'en souvient encore.

**Rising Action:**
Le DAF a installé "un nouveau truc" sur son poste. Elle ouvre Reekon à contrecœur. "Encore un logiciel à apprendre..." Elle clique sur "Nouveau rapprochement", uploade son export Sage et le fichier fournisseur. L'interface lui demande de sélectionner les colonnes clés — "N° facture" et "Montant". Simple. Elle clique sur "Lancer".

**Climax:**
47 secondes. Le rapport s'affiche. Vert: 94% de correspondance. Orange: 12 écarts de montants à vérifier. Rouge: 8 factures absentes côté fournisseur. Marie n'en croit pas ses yeux. Elle télécharge le rapport Excel — tout est là, classé, avec les montants d'écart calculés.

**Resolution:**
À 11h, elle envoie le rapport au DAF. "C'est fait." Il répond: "Déjà?!" Elle sourit. Pour la première fois depuis des années, elle a du temps pour son café. Le commissaire aux comptes n'aura rien à redire.

**Capacités révélées:**
- Upload multi-fichiers simple
- Sélection intuitive des colonnes clés
- Traitement rapide (< 1 min)
- Rapport téléchargeable immédiatement
- Catégorisation claire des écarts (correspondances/écarts montants/absents)

---

### Journey 2: Thomas — "Le client impossible"

**Persona:** Thomas, 38 ans, expert-comptable associé, cabinet de 15 personnes, 40 clients.

**Opening Scene:**
Garage Dupont, son client le plus désorganisé. Chaque année, c'est la même histoire: des factures dans tous les sens, un logiciel de caisse archaïque, et un gérant qui "ne comprend pas pourquoi ça ne colle jamais". Thomas facture 2h, en passe 6. Cette année, il a décidé d'essayer autre chose.

**Rising Action:**
Thomas exporte la balance clients du logiciel comptable et récupère l'export caisse du garage (un CSV avec des virgules comme séparateurs décimaux, évidemment). Il uploade les deux fichiers dans Reekon. Le parsing détecte automatiquement le format. Il crée une clé composite: "Date + Montant arrondi" — la seule façon de matcher ces données chaotiques.

**Climax:**
Le rapport tombe. 67% de correspondance directe. 28 encaissements sans facture correspondante. 15 factures non encaissées de plus de 90 jours. Thomas voit immédiatement le problème: M. Dupont encaisse en liquide sans émettre de facture. Il a enfin la preuve chiffrée pour la conversation difficile qu'il repoussait.

**Resolution:**
Thomas facture 45 minutes au lieu de 6 heures. Il envoie le rapport à M. Dupont avec un message: "Voici les incohérences à régulariser avant le bilan." Le lendemain, il montre Reekon à ses 2 associés. "On le déploie sur tous les clients."

**Capacités révélées:**
- Parsing intelligent (détection séparateurs, formats)
- Clés composites personnalisables
- Identification des anomalies métier (pas seulement techniques)
- Rapport exploitable pour communication client
- Gain de temps mesurable et facturable

---

### Journey 3: Le DAF — "L'outil qui évite l'audit"

**Persona:** Philippe, 55 ans, DAF d'une ETI de 200 personnes, supervise 4 comptables.

**Opening Scene:**
Réunion de clôture semestrielle. Le commissaire aux comptes fronce les sourcils: "Vos rapprochements inter-compagnies présentent des écarts récurrents. Si ça continue, on devra émettre une réserve." Philippe sent la sueur froide. Une réserve sur les comptes, c'est sa crédibilité en jeu.

**Rising Action:**
Philippe cherche une solution. Les outils BI coûtent 50k€ et nécessitent 6 mois d'intégration. Excel, son équipe le fait déjà — mal. Il découvre Reekon via un confrère DAF. Essai gratuit, pas d'intégration, données éphémères (RGPD). Il fait tester par Marie sur un cas simple.

**Climax:**
Marie revient 2 heures plus tard avec un rapport impeccable — normalement, ça prend 2 jours. Philippe comprend: ce n'est pas un outil de plus, c'est du temps comptable récupéré. Il calcule: 4 comptables × 5 jours/an de rapprochements = 20 jours. À 400€/jour chargé, c'est 8000€ de coût actuel. L'abonnement Reekon: une fraction.

**Resolution:**
Philippe déploie Reekon sur l'équipe. Au prochain passage du commissaire aux comptes, les rapprochements sont documentés, tracés, sans écart. "Excellente rigueur cette année." Philippe respire.

**Capacités révélées:**
- Conformité RGPD (argument décideur)
- ROI démontrable (temps = argent)
- Déploiement sans intégration IT
- Traçabilité pour audit
- Adoption progressive possible (test → déploiement)

---

### Journey Requirements Summary

| Capacité | Marie | Thomas | DAF |
|----------|-------|--------|-----|
| Upload multi-formats | ✓ | ✓ | |
| Parsing intelligent | | ✓ | |
| Sélection colonnes clés | ✓ | ✓ | |
| Clés composites | | ✓ | |
| Traitement < 1 min | ✓ | ✓ | |
| Rapport Excel téléchargeable | ✓ | ✓ | |
| Catégorisation écarts | ✓ | ✓ | |
| Conformité RGPD | | | ✓ |
| Essai sans intégration | | | ✓ |

## Domain-Specific Requirements

### Conformité & Réglementaire

| Exigence | Détail | Priorité |
|----------|--------|----------|
| RGPD | Destruction immédiate des fichiers uploadés après traitement | MVP |
| RGPD | Aucune conservation des rapports générés côté serveur | MVP |
| Souveraineté | Hébergement France (OVH) | MVP |

### Politique de Données

| Donnée | Rétention | Justification |
|--------|-----------|---------------|
| Fichiers sources | 0 (destruction immédiate) | RGPD + confiance utilisateur |
| Rapports générés | 0 (téléchargement client uniquement) | Simplicité + RGPD |
| Modèles de rapprochement | Persistant (compte utilisateur) | Valeur utilisateur, réutilisation |
| Compte utilisateur | Jusqu'à suppression | Standard SaaS |

### Contraintes Techniques

- **Traitement stateless:** Aucun fichier persisté = architecture simplifiée
- **Export client-side:** Le rapport est généré et téléchargé, jamais stocké
- **Hébergement:** OVH Cloud (région France)

### Risques & Mitigations

| Risque | Mitigation |
|--------|------------|
| Perte de rapport avant téléchargement | Téléchargement automatique à la fin du traitement |
| Données sensibles en transit | HTTPS obligatoire, chiffrement TLS |
| Accès non autorisé | Magic link + session limitée |

## SaaS B2B Specific Requirements

### Project-Type Overview

Reekon est une application web SaaS B2B mono-tenant (MVP) avec architecture full-stack NextJS. Le traitement des fichiers s'effectue côté serveur pour garantir une performance constante et faciliter le débogage.

### Technical Architecture Considerations

#### Stack Technique MVP

| Couche | Technologie | Notes |
|--------|-------------|-------|
| Frontend | NextJS (React) | App Router, Server Components |
| Backend | NextJS API Routes | Serverless functions |
| Database | Supabase (PostgreSQL) | Cloud MVP → self-hosted V2 |
| Auth | Supabase Auth | Magic link email |
| File Processing | Server-side (Node.js) | Parsing xlsx, csv, txt |
| Hosting | OVH Cloud | Région France |

#### Flux de Données

```
[Upload fichiers] → [API Route NextJS] → [Parsing serveur]
                                              ↓
[Téléchargement rapport] ← [Génération Excel] ← [Moteur rapprochement]
                                              ↓
                                    [Destruction fichiers]
```

#### Contraintes Architecturales

| Contrainte | Implication |
|------------|-------------|
| Stateless | Pas de stockage fichiers, traitement en mémoire |
| RGPD | Destruction immédiate post-traitement |
| Performance | < 30s pour 5000 lignes |
| Supabase Cloud | Limites à surveiller (storage, compute) |

### Implementation Considerations

#### Dépendances Clés (estimées)

| Fonction | Librairie probable |
|----------|-------------------|
| Parsing XLSX | `xlsx` ou `exceljs` |
| Parsing CSV | `papaparse` |
| Génération rapport Excel | `exceljs` |
| Validation données | `zod` |
| UI Components | `shadcn/ui` ou similaire |

#### Points d'Attention MVP

1. **Limite mémoire API Routes:** fichiers volumineux en streaming si nécessaire
2. **Timeout serverless:** traitement < 30s pour éviter timeout
3. **Supabase row-level security:** à configurer pour isolation données utilisateurs
4. **Migration Supabase self-hosted:** prévoir schéma compatible

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**Approche MVP:** Problem-solving MVP — résoudre UN problème (rapprochement manuel) de façon excellente.

**Contrainte ressources:** Solo développeur junior
- Impact: scope minimal, architecture simple, pas d'over-engineering
- Mitigation: stack moderne bien documentée, patterns standards

### MVP Feature Set (Phase 1)

**Parcours utilisateurs supportés:**
- Marie — rapprochement ponctuel
- Thomas — rapprochement + sauvegarde modèle pour réutilisation
- DAF — évaluation / déploiement (pas de feature spécifique, juste l'essai)

**Capacités Must-Have:**

| Priorité | Fonctionnalité | Complexité estimée |
|----------|----------------|-------------------|
| P0 | Auth magic link (Supabase) | Faible |
| P0 | Upload fichiers (xlsx, xls, csv, txt) | Moyenne |
| P0 | Parsing intelligent + détection séparateur | Moyenne |
| P0 | Mapping colonnes + clés composites | Moyenne |
| P0 | Nettoyage + déduplication | Moyenne |
| P0 | Moteur de rapprochement bidirectionnel | Haute |
| P0 | Dashboard synthèse (taux, alertes couleur) | Moyenne |
| P0 | Génération rapport Excel | Moyenne |
| P0 | Destruction fichiers post-traitement | Faible |
| P1 | Sauvegarde modèles de rapprochement | Moyenne |

### Post-MVP Features

**Phase 2 (V2 — après validation marché):**
- Assistant IA suggestion de clés
- SSO entreprise (Google, Microsoft)
- Gestion abonnements (Stripe)
- Historique des analyses

**Phase 3 (V3 — scale):**
- Intégrations ERP directes
- API pour automatisation
- Multi-utilisateurs par compte
- Expansion internationale

### Risk Mitigation Strategy

| Type de risque | Risque | Mitigation |
|----------------|--------|------------|
| Technique | Moteur de rapprochement complexe | Commencer par algorithme simple (exact match), itérer |
| Technique | Parsing formats variés | Utiliser librairies éprouvées (xlsx, papaparse) |
| Ressources | Solo dev junior = vélocité limitée | Scope minimal, pas de gold-plating |
| Ressources | Courbe d'apprentissage | NextJS + Supabase bien documentés |
| Marché | Adoption incertaine | 5 users pilotes avant d'investir plus |

### Contingency Plan

Si le scope MVP s'avère trop ambitieux:
1. **Couper en premier:** Modèles sauvegardés (revient en V2)
2. **Simplifier:** Formats supportés réduits (xlsx + csv uniquement)
3. **Reporter:** Clés composites (clé simple uniquement pour MVP)

## Functional Requirements

### Authentification & Compte Utilisateur

- **FR1:** L'utilisateur peut créer un compte avec son adresse email
- **FR2:** L'utilisateur peut se connecter via magic link (lien envoyé par email)
- **FR3:** L'utilisateur peut se déconnecter de son compte
- **FR4:** L'utilisateur peut supprimer son compte et toutes ses données

### Import de Fichiers

- **FR5:** L'utilisateur peut uploader un premier fichier (Système A)
- **FR6:** L'utilisateur peut uploader un second fichier (Système B)
- **FR7:** Le système peut accepter les formats xlsx, xls, csv et txt
- **FR8:** Le système peut détecter automatiquement le séparateur des fichiers CSV/TXT
- **FR9:** Le système peut détecter automatiquement l'encodage des fichiers
- **FR10:** L'utilisateur peut prévisualiser les données importées avant traitement

### Configuration du Rapprochement

- **FR11:** L'utilisateur peut sélectionner les colonnes à utiliser comme clé de rapprochement
- **FR12:** L'utilisateur peut créer une clé composite en combinant plusieurs colonnes
- **FR13:** L'utilisateur peut sélectionner la colonne de montant à comparer
- **FR14:** L'utilisateur peut définir les lignes à exclure (en-têtes, pieds de page)
- **FR15:** L'utilisateur peut activer/désactiver la déduplication automatique

### Traitement & Rapprochement

- **FR16:** Le système peut effectuer un rapprochement bidirectionnel entre les deux fichiers
- **FR17:** Le système peut identifier les correspondances exactes (clé identique)
- **FR18:** Le système peut identifier les écarts de montants (clé identique, montant différent)
- **FR19:** Le système peut identifier les lignes uniques Système A (absentes de B)
- **FR20:** Le système peut identifier les lignes uniques Système B (absentes de A)
- **FR21:** Le système peut dédupliquer les lignes basées sur la clé définie
- **FR22:** Le système peut calculer la variance entre les montants discordants

### Visualisation des Résultats

- **FR23:** L'utilisateur peut voir un dashboard de synthèse après traitement
- **FR24:** L'utilisateur peut voir le taux de correspondance global (%)
- **FR25:** L'utilisateur peut voir le nombre de correspondances, écarts et uniques
- **FR26:** L'utilisateur peut voir des indicateurs visuels colorés (vert/orange/rouge)
- **FR27:** L'utilisateur peut voir le détail des écarts de montants
- **FR28:** L'utilisateur peut voir le détail des lignes uniques par système

### Export & Rapports

- **FR29:** L'utilisateur peut télécharger un rapport Excel détaillé
- **FR30:** Le rapport contient un onglet pour les écarts Système A
- **FR31:** Le rapport contient un onglet pour les écarts Système B
- **FR32:** Le rapport contient une synthèse des métriques de rapprochement
- **FR33:** Le téléchargement du rapport se déclenche automatiquement à la fin du traitement

### Gestion des Modèles de Rapprochement

- **FR34:** L'utilisateur peut sauvegarder une configuration de rapprochement comme modèle
- **FR35:** L'utilisateur peut nommer et décrire un modèle sauvegardé
- **FR36:** L'utilisateur peut voir la liste de ses modèles sauvegardés
- **FR37:** L'utilisateur peut appliquer un modèle existant à un nouveau rapprochement
- **FR38:** L'utilisateur peut modifier un modèle existant
- **FR39:** L'utilisateur peut supprimer un modèle

### Conformité & Sécurité

- **FR40:** Le système détruit les fichiers uploadés immédiatement après traitement
- **FR41:** Le système ne conserve pas les rapports générés côté serveur
- **FR42:** Le système chiffre les données en transit (HTTPS/TLS)
- **FR43:** L'utilisateur peut accéder uniquement à ses propres modèles

## Non-Functional Requirements

### Performance

| NFR | Critère | Mesure |
|-----|---------|--------|
| **NFR-P1** | Temps de traitement rapprochement | < 30 secondes pour fichiers ≤ 5000 lignes |
| **NFR-P2** | Temps de chargement initial | < 3 secondes (first contentful paint) |
| **NFR-P3** | Temps d'upload fichier | < 5 secondes pour fichiers ≤ 10 MB |
| **NFR-P4** | Réactivité interface | Feedback utilisateur < 200ms sur toute action |

### Sécurité

| NFR | Critère | Mesure |
|-----|---------|--------|
| **NFR-S1** | Chiffrement transit | HTTPS/TLS 1.3 obligatoire |
| **NFR-S2** | Authentification | Magic link avec expiration < 15 minutes |
| **NFR-S3** | Session utilisateur | Expiration automatique après 24h d'inactivité |
| **NFR-S4** | Isolation données | Un utilisateur ne peut accéder qu'à ses propres modèles |
| **NFR-S5** | Destruction fichiers | Fichiers uploadés supprimés < 1 seconde après traitement |
| **NFR-S6** | Hébergement | Serveurs localisés en France (OVH) |

### Fiabilité

| NFR | Critère | Mesure |
|-----|---------|--------|
| **NFR-R1** | Disponibilité MVP | 99% uptime (hors maintenance planifiée) |
| **NFR-R2** | Taux d'erreur traitement | < 1% d'échecs système |
| **NFR-R3** | Récupération erreur | Message d'erreur clair + possibilité de réessayer |

### Utilisabilité

| NFR | Critère | Mesure |
|-----|---------|--------|
| **NFR-U1** | Time-to-value | Inscription → premier rapport < 10 minutes |
| **NFR-U2** | Apprentissage | Utilisateur complète un rapprochement sans aide dès le 1er essai |
| **NFR-U3** | Lisibilité | Contraste suffisant pour écrans de bureau standard |
| **NFR-U4** | Responsive | Fonctionnel sur écrans ≥ 1024px (desktop focus) |

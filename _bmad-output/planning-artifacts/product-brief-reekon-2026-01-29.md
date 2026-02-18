---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - cahier-charge-reekon.txt
date: 2026-01-29
author: reekon
---

# Product Brief: reekon

<!-- Content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

Reekon est un service SaaS de rapprochement universel conçu pour les comptables, experts-comptables et DAF. Face à l'absence d'outils accessibles sur le marché, Reekon permet de comparer deux flux de données hétérogènes pour identifier les doublons, écarts de réconciliation et anomalies de montants — en quelques clics plutôt qu'en plusieurs jours.

---

## Core Vision

### Problem Statement

Les professionnels comptables passent plusieurs jours par an à effectuer des rapprochements manuels entre systèmes (exports ERP, relevés bancaires, fichiers tiers). Ce travail fastidieux sous Excel génère des erreurs, mobilise des ressources coûteuses et expose l'entreprise à des risques d'amende lors des audits des commissaires aux comptes.

### Problem Impact

- **Temps perdu** : Plusieurs jours par an consacrés à des tâches manuelles répétitives
- **Erreurs humaines** : Risque d'incohérences non détectées dans les comptes
- **Coût financier** : Temps salarié détourné de tâches à valeur ajoutée
- **Risque réglementaire** : Amendes possibles en cas de mauvaise gestion identifiée par les commissaires aux comptes
- **Fréquence insuffisante** : Les bonnes pratiques (rapprochement mensuel) sont rarement appliquées faute d'outils adaptés

### Why Existing Solutions Fall Short

- **Outils BI** : Trop coûteux et nécessitent des compétences techniques absentes en interne
- **Modules ERP** : Rigides, limités à leur propre écosystème
- **Excel manuel** : Chronophage, source d'erreurs, non-scalable
- **Aucun outil dédié** : Le marché ne propose pas de solution de rapprochement universel accessible

### Proposed Solution

Reekon offre un moteur de rapprochement agnostique qui :
- Ingère n'importe quel format d'export (xlsx, xls, csv, txt)
- Permet à l'utilisateur de définir ses propres clés de rapprochement (simples ou composites)
- Nettoie et déduplique automatiquement les données
- Génère un rapport clair avec les écarts, incohérences et actions à mener
- Sauvegarde les configurations pour les rapprochements récurrents

### Key Differentiators

1. **Agnosticisme total** : Compatible avec tout export, tout système — aucune intégration requise
2. **Simplicité radicale** : Interface intuitive conçue pour des comptables, pas des data analysts
3. **Rapport actionnable** : Le moment "Aha" — l'utilisateur ouvre un rapport clair avec les incohérences et tâches restantes
4. **Conformité RGPD** : Données éphémères, destruction immédiate après traitement
5. **Flexibilité des clés** : Clés simples ou composites définies par l'utilisateur, pas par le système

---

## Target Users

### Primary Users

#### Persona 1 : Marie, Comptable en entreprise

**Profil :**
- Femme, 52 ans, comptable depuis 25 ans dans une ETI industrielle
- Peu à l'aise avec l'informatique, résistante au changement
- Ne cherche pas à élargir son périmètre — fait son travail, pas plus
- Utilise Excel par habitude, connaît ses raccourcis par cœur

**Frustrations actuelles :**
- Pression hiérarchique pour des rapprochements "urgents" qu'on lui demande à la dernière minute
- Se sent injustement responsable des retards alors que les données arrivent tard
- Stress des clôtures annuelles — plusieurs jours de travail répétitif et ingrat
- Aucun outil adapté : "on m'a toujours dit de faire avec Excel"

**Relation au produit :**
- N'ira jamais chercher Reekon d'elle-même — adoption imposée par la hiérarchie (DAF)
- Déclencheur d'acceptation : si l'outil est plus simple qu'Excel et réduit son stress
- Critère de succès : "J'ai fini en 2 heures au lieu de 2 jours"

**Moment Aha :** Quand elle ouvre le premier rapport et voit immédiatement les écarts identifiés, sans avoir cherché ligne par ligne.

---

#### Persona 2 : Thomas, Expert-Comptable en cabinet

**Profil :**
- Homme, 38 ans, expert-comptable associé dans un cabinet de 15 personnes
- Gère un portefeuille de 40 clients (TPE/PME)
- Toujours sous pression des délais fiscaux et des clôtures
- Cherche constamment à optimiser le temps facturable

**Frustrations actuelles :**
- Rapprochements manuels = temps non facturable ou sous-facturé
- Qualité variable des exports clients (formats différents, données incomplètes)
- Doit parfois refaire le travail des juniors qui font des erreurs

**Relation au produit :**
- Utilise Reekon directement pour les cas complexes
- Délègue aux collaborateurs juniors pour les rapprochements standards (après formation)
- Décideur d'achat pour son cabinet

**Critère d'adoption :** Gain de temps facturable — si 2h de rapprochement deviennent 15 min, c'est du temps récupéré pour d'autres missions.

**Moment Aha :** Premier rapport généré pour un client difficile — "J'aurais mis une demi-journée, là c'est fait."

---

### Secondary Users

#### Le DAF — Décideur, pas utilisateur

**Profil :**
- Directeur Administratif et Financier, supervise l'équipe comptable
- Ne fait pas les rapprochements lui-même
- Responsable de la fiabilité des comptes face aux commissaires aux comptes

**Rôle dans l'adoption :**
- Décideur d'achat en entreprise
- Impose l'outil à l'équipe comptable
- Attend des métriques : taux de correspondance, écarts identifiés, temps gagné

**Critère de succès :** Zéro remarque des commissaires aux comptes sur les rapprochements.

---

### User Journey

| Étape | Marie (Comptable) | Thomas (Expert-Comptable) |
|-------|-------------------|---------------------------|
| **Découverte** | Imposé par le DAF | Recherche active ou bouche-à-oreille confrères |
| **Onboarding** | Formation minimale, doit être ultra-simple | Auto-formation rapide, teste sur un client |
| **Premier usage** | Upload 2 fichiers, suit les instructions pas à pas | Configure un modèle de rapprochement réutilisable |
| **Moment Aha** | Rapport clair dès le premier essai | Temps divisé par 4 sur un cas réel |
| **Usage récurrent** | Rapprochements mensuels/annuels, mêmes modèles | Déploiement sur tout le portefeuille clients |
| **Fidélisation** | "Je ne reviens plus à Excel" | ROI clair = renouvellement abonnement |

---

## Success Metrics

### Métriques de Succès Utilisateur

| Métrique | Indicateur | Objectif |
|----------|------------|----------|
| **Gain de temps** | Temps de rapprochement avant/après | Réduction de 80% (de 2 jours à ~2 heures) |
| **Fiabilité perçue** | Score de satisfaction utilisateur (NPS ou CSAT) | NPS > 30 / CSAT > 4/5 |
| **Adoption** | Fréquence d'usage par utilisateur | ≥ 1 rapprochement/mois pour les utilisateurs actifs |
| **Rétention comportementale** | Utilisateurs revenant après premier usage | > 70% reviennent dans les 30 jours |

### Business Objectives

| Horizon | Objectif | Indicateur de succès |
|---------|----------|---------------------|
| **3 mois** | Validation produit-marché | 10 utilisateurs réguliers (≥ 1 usage/mois) |
| **6 mois** | Croissance initiale | Croissance organique (bouche-à-oreille, recommandations) |
| **12 mois** | Rentabilité | Revenus couvrant les coûts opérationnels |

### Key Performance Indicators

**KPIs Produit :**
- **Taux de complétion** : % d'utilisateurs qui terminent un rapprochement après upload
- **Time-to-value** : Temps entre inscription et premier rapport généré (objectif : < 10 min)
- **Taux d'erreur système** : Rapprochements échoués pour raisons techniques (objectif : < 1%)

**KPIs Business :**
- **MRR (Monthly Recurring Revenue)** : Suivi mensuel des revenus d'abonnement
- **Taux de rétention** : 80-90% de renouvellement des abonnements
- **CAC/LTV** : Coût d'acquisition vs valeur vie client (à définir une fois le pricing fixé)
- **Churn rate** : < 10-20% d'attrition annuelle

**KPIs Acquisition :**
- **Nouveaux inscrits/mois** : Croissance de la base utilisateurs
- **Taux de conversion** : Visiteurs → Inscrits → Utilisateurs payants
- **Source d'acquisition** : Tracking des canaux (organique, referral, payant)

---

## MVP Scope

### Core Features

**Authentification :**
- Magic link (email) — pas de mot de passe, connexion simplifiée

**Phase 1 — Ingestion Flexible :**
- Upload multi-formats : .xlsx, .xls, .csv, .txt
- Parsing intelligent avec détection automatique du séparateur
- Interface de mapping : sélection manuelle des colonnes pivots
- Création de clés composites par concaténation

**Phase 2 — Nettoyage & Validation :**
- Nettoyage paramétrable (exclusion de lignes en-tête/pied de page)
- Déduplication dynamique basée sur les clés définies
- Contrôle qualité : identification des lignes avec identifiants manquants

**Phase 3 — Analyse des Écarts :**
- Rapprochement bidirectionnel (Uniques Système A / Uniques Système B)
- Analyse de variance sur les écarts de montants

**Livrables :**
- Dashboard de synthèse : taux de correspondance, alertes visuelles (Vert/Orange/Rouge)
- Rapport Excel détaillé : Onglet écarts Système A, Onglet écarts Système B
- Synthèse textuelle des métriques

**Sécurité RGPD :**
- Destruction immédiate des fichiers sources après traitement
- Données éphémères

---

### Out of Scope for MVP

| Fonctionnalité | Raison du report | Version cible |
|----------------|------------------|---------------|
| Assistant IA (suggestion de clés) | Complexité technique, valeur à valider d'abord | V2 |
| SSO (Google, Microsoft, LinkedIn) | Magic link suffisant pour démarrer | V2 |
| Gestion des crédits/plans | Pas de monétisation immédiate | V2 |
| Stripe Billing Portal | Abonnement non requis pour MVP | V2 |
| Modèles de rapprochement sauvegardés | Nice-to-have, pas critique pour validation | V2 |
| Historique des analyses | Focus sur l'usage ponctuel d'abord | V2 |
| Conservation longue durée des rapports | 24h suffisant pour MVP | V2 |

---

### MVP Success Criteria

**Validation utilisateur :**
- 5 utilisateurs réalisent un rapprochement complet sans assistance
- Time-to-value < 10 minutes (inscription → premier rapport)
- Retour positif sur la clarté du rapport généré

**Validation technique :**
- Support effectif des 4 formats de fichiers
- Taux d'erreur système < 1%
- Performance acceptable (traitement < 30s pour fichiers standards)

**Go/No-Go pour V2 :**
- Si les 5 utilisateurs pilotes valident l'utilité → passage à la V2
- Si blocages majeurs → itération sur le MVP

---

### Future Vision

**Court terme (V2 — 6 mois) :**
- Assistant IA pour suggestion automatique des clés de rapprochement
- Sauvegarde des modèles de rapprochement récurrents
- SSO entreprise (Google, Microsoft)
- Gestion des abonnements et plans (Stripe)
- Historique des analyses avec métriques de succès

**Moyen terme (V3 — 12 mois) :**
- Intégrations ERP directes (Sage, Cegid, QuickBooks...)
- API pour automatisation des rapprochements
- Multi-utilisateurs par compte (équipes comptables)
- Rapports avancés et analytics

**Long terme (2-3 ans) :**
- Plateforme complète de réconciliation comptable
- Nouveaux cas d'usage : rapprochement bancaire, contrôle de gestion, audit
- Expansion internationale
- Marketplace de connecteurs et modèles

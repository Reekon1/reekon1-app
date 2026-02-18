import type { ReconciliationConfig } from "@/lib/reconciliation/types";

export interface ApplyTemplateResult {
  config: ReconciliationConfig;
  warnings: string[];
}

/**
 * Configuration de rapprochement stockée par NOM de colonne (pas par index).
 * Permet de réutiliser un modèle même si l'ordre des colonnes change.
 */
export interface TemplateConfig {
  keyColumnsA: string[];
  keyColumnsB: string[];
  amountColumnA: string | null;
  amountColumnB: string | null;
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

/**
 * Convertit une ReconciliationConfig (indices) en TemplateConfig (noms de colonnes).
 */
export function toTemplateConfig(
  config: ReconciliationConfig,
  headersA: string[],
  headersB: string[]
): TemplateConfig {
  return {
    keyColumnsA: config.keyColumnsA.map((i) => headersA[i] ?? ""),
    keyColumnsB: config.keyColumnsB.map((i) => headersB[i] ?? ""),
    amountColumnA:
      config.amountColumnA !== null ? (headersA[config.amountColumnA] ?? null) : null,
    amountColumnB:
      config.amountColumnB !== null ? (headersB[config.amountColumnB] ?? null) : null,
    excludeHeaderRowsA: config.excludeHeaderRowsA,
    excludeHeaderRowsB: config.excludeHeaderRowsB,
    excludeFooterRowsA: config.excludeFooterRowsA,
    excludeFooterRowsB: config.excludeFooterRowsB,
    deduplication: config.deduplication,
  };
}

/**
 * Convertit une TemplateConfig (noms de colonnes) en ReconciliationConfig (indices).
 * Retourne les warnings pour les colonnes non trouvées.
 */
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
      return 0;
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

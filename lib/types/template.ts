import type { ReconciliationConfig, KeyTransform, KeyMapping } from "@/lib/reconciliation/types";
import { legacyToKeyMappings } from "@/lib/reconciliation/normalizer";

export interface ApplyTemplateResult {
  config: ReconciliationConfig;
  warnings: string[];
}

export interface TemplateKeyMapping {
  colsA: string[];
  colsB: string[];
  separator: string;
  transform: KeyTransform;
}

/**
 * Configuration de rapprochement stockee par NOM de colonne (pas par index).
 * Permet de reutiliser un modele meme si l'ordre des colonnes change.
 * Supports both legacy format (keyColumnsA/B) and new format (keyMappings).
 */
export interface TemplateConfig {
  // New format
  keyMappings?: TemplateKeyMapping[];
  // Legacy format (kept for backward compat with saved templates)
  keyColumnsA: string[];
  keyColumnsB: string[];
  amountColumnA: string | null;
  amountColumnB: string | null;
  excludeHeaderRowsA: number;
  excludeHeaderRowsB: number;
  excludeFooterRowsA: number;
  excludeFooterRowsB: number;
  deduplication: boolean;
  keyTransforms?: KeyTransform[];
  keySeparator?: string;
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
 * Writes both new keyMappings and legacy keyColumnsA/B for backward compat.
 */
export function toTemplateConfig(
  config: ReconciliationConfig,
  headersA: string[],
  headersB: string[]
): TemplateConfig {
  const templateMappings: TemplateKeyMapping[] = config.keyMappings.map((m) => ({
    colsA: m.colsA.map((i) => headersA[i] ?? ""),
    colsB: m.colsB.map((i) => headersB[i] ?? ""),
    separator: m.separator,
    transform: m.transform,
  }));

  // Also write legacy flat arrays for backward compat with older app versions
  const legacyColumnsA: string[] = [];
  const legacyColumnsB: string[] = [];
  const legacyTransforms: KeyTransform[] = [];
  for (const m of config.keyMappings) {
    // For legacy format, only the first column of each side is used
    legacyColumnsA.push(headersA[m.colsA[0]] ?? "");
    legacyColumnsB.push(headersB[m.colsB[0]] ?? "");
    legacyTransforms.push(m.transform);
  }

  return {
    keyMappings: templateMappings,
    keyColumnsA: legacyColumnsA,
    keyColumnsB: legacyColumnsB,
    amountColumnA:
      config.amountColumnA !== null ? (headersA[config.amountColumnA] ?? null) : null,
    amountColumnB:
      config.amountColumnB !== null ? (headersB[config.amountColumnB] ?? null) : null,
    excludeHeaderRowsA: config.excludeHeaderRowsA,
    excludeHeaderRowsB: config.excludeHeaderRowsB,
    excludeFooterRowsA: config.excludeFooterRowsA,
    excludeFooterRowsB: config.excludeFooterRowsB,
    deduplication: config.deduplication,
    keyTransforms: legacyTransforms,
  };
}

/**
 * Convertit une TemplateConfig (noms de colonnes) en ReconciliationConfig (indices).
 * Handles both new keyMappings format and legacy keyColumnsA/B format.
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
      warnings.push(`Colonne '${name}' non trouvee dans ${system}`);
      return 0;
    }
    return idx;
  };

  let keyMappings: KeyMapping[];

  if (template.keyMappings && template.keyMappings.length > 0) {
    // New format
    keyMappings = template.keyMappings.map((tm) => ({
      colsA: tm.colsA.map((n) => resolveIndex(n, headersA, "Systeme A")),
      colsB: tm.colsB.map((n) => resolveIndex(n, headersB, "Systeme B")),
      separator: tm.separator,
      transform: tm.transform,
    }));
  } else {
    // Legacy format: convert via legacyToKeyMappings
    const resolvedA = template.keyColumnsA.map((n) => resolveIndex(n, headersA, "Systeme A"));
    const resolvedB = template.keyColumnsB.map((n) => resolveIndex(n, headersB, "Systeme B"));
    keyMappings = legacyToKeyMappings(
      resolvedA,
      resolvedB,
      template.keyTransforms,
      template.keySeparator
    );
  }

  return {
    config: {
      keyMappings,
      amountColumnA: template.amountColumnA
        ? resolveIndex(template.amountColumnA, headersA, "Systeme A")
        : null,
      amountColumnB: template.amountColumnB
        ? resolveIndex(template.amountColumnB, headersB, "Systeme B")
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

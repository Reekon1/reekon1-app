import { describe, it, expect } from "vitest";
import { toTemplateConfig, fromTemplateConfig } from "./template";
import type { ReconciliationConfig } from "@/lib/reconciliation/types";
import type { TemplateConfig } from "./template";

describe("toTemplateConfig", () => {
  const headersA = ["Identifiant", "Nom", "Date", "Montant"];
  const headersB = ["Id_dl", "Libellé", "DateFacture", "Montant HT", "Code"];

  const baseConfig: ReconciliationConfig = {
    keyColumnsA: [0],
    keyColumnsB: [0],
    amountColumnA: 3,
    amountColumnB: 3,
    excludeHeaderRowsA: 0,
    excludeHeaderRowsB: 0,
    excludeFooterRowsA: 0,
    excludeFooterRowsB: 0,
    deduplication: false,
  };

  it("converts single key columns by index to name", () => {
    const result = toTemplateConfig(baseConfig, headersA, headersB);
    expect(result.keyColumnsA).toEqual(["Identifiant"]);
    expect(result.keyColumnsB).toEqual(["Id_dl"]);
  });

  it("converts composite key columns", () => {
    const config: ReconciliationConfig = {
      ...baseConfig,
      keyColumnsA: [0, 2],
      keyColumnsB: [0, 2],
    };
    const result = toTemplateConfig(config, headersA, headersB);
    expect(result.keyColumnsA).toEqual(["Identifiant", "Date"]);
    expect(result.keyColumnsB).toEqual(["Id_dl", "DateFacture"]);
  });

  it("converts amount columns to names", () => {
    const result = toTemplateConfig(baseConfig, headersA, headersB);
    expect(result.amountColumnA).toBe("Montant");
    expect(result.amountColumnB).toBe("Montant HT");
  });

  it("handles null amount columns", () => {
    const config: ReconciliationConfig = {
      ...baseConfig,
      amountColumnA: null,
      amountColumnB: null,
    };
    const result = toTemplateConfig(config, headersA, headersB);
    expect(result.amountColumnA).toBeNull();
    expect(result.amountColumnB).toBeNull();
  });

  it("preserves non-column config values", () => {
    const config: ReconciliationConfig = {
      ...baseConfig,
      excludeHeaderRowsA: 2,
      excludeFooterRowsB: 3,
      deduplication: true,
    };
    const result = toTemplateConfig(config, headersA, headersB);
    expect(result.excludeHeaderRowsA).toBe(2);
    expect(result.excludeFooterRowsB).toBe(3);
    expect(result.deduplication).toBe(true);
  });

  it("handles out-of-bounds index gracefully", () => {
    const config: ReconciliationConfig = {
      ...baseConfig,
      keyColumnsA: [99],
    };
    const result = toTemplateConfig(config, headersA, headersB);
    expect(result.keyColumnsA).toEqual([""]);
  });
});

describe("fromTemplateConfig", () => {
  const headersA = ["Identifiant", "Nom", "Date", "Montant"];
  const headersB = ["Id_dl", "Libellé", "DateFacture", "Montant HT", "Code"];

  const baseTemplate: TemplateConfig = {
    keyColumnsA: ["Identifiant"],
    keyColumnsB: ["Id_dl"],
    amountColumnA: "Montant",
    amountColumnB: "Montant HT",
    excludeHeaderRowsA: 0,
    excludeHeaderRowsB: 0,
    excludeFooterRowsA: 0,
    excludeFooterRowsB: 0,
    deduplication: false,
  };

  it("resolves single key columns by name to index", () => {
    const result = fromTemplateConfig(baseTemplate, headersA, headersB);
    expect(result.config.keyColumnsA).toEqual([0]);
    expect(result.config.keyColumnsB).toEqual([0]);
    expect(result.warnings).toEqual([]);
  });

  it("resolves composite key columns", () => {
    const template: TemplateConfig = {
      ...baseTemplate,
      keyColumnsA: ["Identifiant", "Date"],
      keyColumnsB: ["Id_dl", "DateFacture"],
    };
    const result = fromTemplateConfig(template, headersA, headersB);
    expect(result.config.keyColumnsA).toEqual([0, 2]);
    expect(result.config.keyColumnsB).toEqual([0, 2]);
    expect(result.warnings).toEqual([]);
  });

  it("resolves amount columns by name", () => {
    const result = fromTemplateConfig(baseTemplate, headersA, headersB);
    expect(result.config.amountColumnA).toBe(3);
    expect(result.config.amountColumnB).toBe(3);
  });

  it("handles null amount columns", () => {
    const template: TemplateConfig = {
      ...baseTemplate,
      amountColumnA: null,
      amountColumnB: null,
    };
    const result = fromTemplateConfig(template, headersA, headersB);
    expect(result.config.amountColumnA).toBeNull();
    expect(result.config.amountColumnB).toBeNull();
  });

  it("generates warning for missing column and falls back to 0", () => {
    const template: TemplateConfig = {
      ...baseTemplate,
      keyColumnsA: ["ColonneInexistante"],
    };
    const result = fromTemplateConfig(template, headersA, headersB);
    expect(result.config.keyColumnsA).toEqual([0]);
    expect(result.warnings).toContain(
      "Colonne 'ColonneInexistante' non trouvée dans Système A"
    );
  });

  it("generates warnings for multiple missing columns", () => {
    const template: TemplateConfig = {
      ...baseTemplate,
      keyColumnsA: ["Missing1", "Missing2"],
      keyColumnsB: ["Missing3"],
    };
    const result = fromTemplateConfig(template, headersA, headersB);
    expect(result.warnings).toHaveLength(3);
  });

  it("matches column names case-insensitively", () => {
    const template: TemplateConfig = {
      ...baseTemplate,
      keyColumnsA: ["identifiant"],
      keyColumnsB: ["ID_DL"],
    };
    const result = fromTemplateConfig(template, headersA, headersB);
    expect(result.config.keyColumnsA).toEqual([0]);
    expect(result.config.keyColumnsB).toEqual([0]);
    expect(result.warnings).toEqual([]);
  });

  it("trims whitespace when matching column names", () => {
    const template: TemplateConfig = {
      ...baseTemplate,
      keyColumnsA: ["  Identifiant  "],
    };
    const result = fromTemplateConfig(template, headersA, headersB);
    expect(result.config.keyColumnsA).toEqual([0]);
    expect(result.warnings).toEqual([]);
  });

  it("preserves non-column config values", () => {
    const template: TemplateConfig = {
      ...baseTemplate,
      excludeHeaderRowsA: 2,
      excludeFooterRowsB: 3,
      deduplication: true,
    };
    const result = fromTemplateConfig(template, headersA, headersB);
    expect(result.config.excludeHeaderRowsA).toBe(2);
    expect(result.config.excludeFooterRowsB).toBe(3);
    expect(result.config.deduplication).toBe(true);
  });

  it("roundtrips through toTemplateConfig then fromTemplateConfig", () => {
    const originalConfig: ReconciliationConfig = {
      keyColumnsA: [0, 2],
      keyColumnsB: [0, 2],
      amountColumnA: 3,
      amountColumnB: 3,
      excludeHeaderRowsA: 1,
      excludeHeaderRowsB: 0,
      excludeFooterRowsA: 0,
      excludeFooterRowsB: 2,
      deduplication: true,
    };
    const templateCfg = toTemplateConfig(originalConfig, headersA, headersB);
    const result = fromTemplateConfig(templateCfg, headersA, headersB);
    expect(result.config).toEqual(originalConfig);
    expect(result.warnings).toEqual([]);
  });
});

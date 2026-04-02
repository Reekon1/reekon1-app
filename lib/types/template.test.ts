import { describe, it, expect } from "vitest";
import { toTemplateConfig, fromTemplateConfig } from "./template";
import type { ReconciliationConfig, KeyMapping } from "@/lib/reconciliation/types";
import type { TemplateConfig } from "./template";

function mapping(
  colsA: number[],
  colsB: number[],
  separator = "",
  transform: KeyMapping["transform"] = "default"
): KeyMapping {
  return { colsA, colsB, separator, transform };
}

describe("toTemplateConfig", () => {
  const headersA = ["Identifiant", "Nom", "Date", "Montant"];
  const headersB = ["Id_dl", "Libelle", "DateFacture", "Montant HT", "Code"];

  const baseConfig: ReconciliationConfig = {
    keyMappings: [mapping([0], [0])],
    amountColumnA: 3,
    amountColumnB: 3,
    excludeHeaderRowsA: 0,
    excludeHeaderRowsB: 0,
    excludeFooterRowsA: 0,
    excludeFooterRowsB: 0,
    deduplication: false,
  };

  it("converts single key mapping to template format", () => {
    const result = toTemplateConfig(baseConfig, headersA, headersB);
    expect(result.keyMappings).toEqual([
      { colsA: ["Identifiant"], colsB: ["Id_dl"], separator: "", transform: "default" },
    ]);
    // Also writes legacy fields
    expect(result.keyColumnsA).toEqual(["Identifiant"]);
    expect(result.keyColumnsB).toEqual(["Id_dl"]);
  });

  it("converts composite key mappings", () => {
    const config: ReconciliationConfig = {
      ...baseConfig,
      keyMappings: [mapping([0], [0]), mapping([2], [2])],
    };
    const result = toTemplateConfig(config, headersA, headersB);
    expect(result.keyMappings).toHaveLength(2);
    expect(result.keyMappings![0].colsA).toEqual(["Identifiant"]);
    expect(result.keyMappings![1].colsA).toEqual(["Date"]);
  });

  it("converts asymmetric key mapping (1:3)", () => {
    const config: ReconciliationConfig = {
      ...baseConfig,
      keyMappings: [mapping([0], [0, 2, 4], "-")],
    };
    const result = toTemplateConfig(config, headersA, headersB);
    expect(result.keyMappings![0].colsA).toEqual(["Identifiant"]);
    expect(result.keyMappings![0].colsB).toEqual(["Id_dl", "DateFacture", "Code"]);
    expect(result.keyMappings![0].separator).toBe("-");
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
});

describe("fromTemplateConfig", () => {
  const headersA = ["Identifiant", "Nom", "Date", "Montant"];
  const headersB = ["Id_dl", "Libelle", "DateFacture", "Montant HT", "Code"];

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

  it("loads legacy template (no keyMappings) via conversion", () => {
    const result = fromTemplateConfig(baseTemplate, headersA, headersB);
    expect(result.config.keyMappings).toHaveLength(1);
    expect(result.config.keyMappings[0].colsA).toEqual([0]);
    expect(result.config.keyMappings[0].colsB).toEqual([0]);
    expect(result.warnings).toEqual([]);
  });

  it("loads legacy composite template", () => {
    const template: TemplateConfig = {
      ...baseTemplate,
      keyColumnsA: ["Identifiant", "Date"],
      keyColumnsB: ["Id_dl", "DateFacture"],
    };
    const result = fromTemplateConfig(template, headersA, headersB);
    expect(result.config.keyMappings).toHaveLength(2);
    expect(result.config.keyMappings[0].colsA).toEqual([0]);
    expect(result.config.keyMappings[1].colsA).toEqual([2]);
  });

  it("loads new-format template with keyMappings", () => {
    const template: TemplateConfig = {
      ...baseTemplate,
      keyMappings: [
        { colsA: ["Identifiant"], colsB: ["Id_dl", "DateFacture", "Code"], separator: "-", transform: "default" },
      ],
    };
    const result = fromTemplateConfig(template, headersA, headersB);
    expect(result.config.keyMappings).toHaveLength(1);
    expect(result.config.keyMappings[0].colsA).toEqual([0]);
    expect(result.config.keyMappings[0].colsB).toEqual([0, 2, 4]);
    expect(result.config.keyMappings[0].separator).toBe("-");
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
    expect(result.config.keyMappings[0].colsA).toEqual([0]);
    expect(result.warnings).toContain(
      "Colonne 'ColonneInexistante' non trouvee dans Systeme A"
    );
  });

  it("matches column names case-insensitively", () => {
    const template: TemplateConfig = {
      ...baseTemplate,
      keyColumnsA: ["identifiant"],
      keyColumnsB: ["ID_DL"],
    };
    const result = fromTemplateConfig(template, headersA, headersB);
    expect(result.config.keyMappings[0].colsA).toEqual([0]);
    expect(result.config.keyMappings[0].colsB).toEqual([0]);
    expect(result.warnings).toEqual([]);
  });

  it("trims whitespace when matching column names", () => {
    const template: TemplateConfig = {
      ...baseTemplate,
      keyColumnsA: ["  Identifiant  "],
    };
    const result = fromTemplateConfig(template, headersA, headersB);
    expect(result.config.keyMappings[0].colsA).toEqual([0]);
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
      keyMappings: [mapping([0], [0]), mapping([2], [2])],
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

  it("roundtrips asymmetric keyMappings", () => {
    const originalConfig: ReconciliationConfig = {
      keyMappings: [mapping([0], [0, 2, 4], "-")],
      amountColumnA: 3,
      amountColumnB: 3,
      excludeHeaderRowsA: 0,
      excludeHeaderRowsB: 0,
      excludeFooterRowsA: 0,
      excludeFooterRowsB: 0,
      deduplication: false,
    };
    const templateCfg = toTemplateConfig(originalConfig, headersA, headersB);
    const result = fromTemplateConfig(templateCfg, headersA, headersB);
    expect(result.config).toEqual(originalConfig);
    expect(result.warnings).toEqual([]);
  });
});

import { describe, it, expect } from "vitest";
import {
  saveTemplateSchema,
  templateConfigSchema,
  updateTemplateSchema,
} from "./template";

const validConfig = {
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

describe("templateConfigSchema", () => {
  it("accepts a valid config", () => {
    const result = templateConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it("accepts null amount columns", () => {
    const result = templateConfigSchema.safeParse({
      ...validConfig,
      amountColumnA: null,
      amountColumnB: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty keyColumnsA", () => {
    const result = templateConfigSchema.safeParse({
      ...validConfig,
      keyColumnsA: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty keyColumnsB", () => {
    const result = templateConfigSchema.safeParse({
      ...validConfig,
      keyColumnsB: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative excludeHeaderRows", () => {
    const result = templateConfigSchema.safeParse({
      ...validConfig,
      excludeHeaderRowsA: -1,
    });
    expect(result.success).toBe(false);
  });

  it("accepts composite keys (multiple columns)", () => {
    const result = templateConfigSchema.safeParse({
      ...validConfig,
      keyColumnsA: ["N° Facture", "Date", "Code Fournisseur"],
      keyColumnsB: ["NumFacture", "DateFacture", "CodeFourn"],
    });
    expect(result.success).toBe(true);
  });
});

describe("saveTemplateSchema", () => {
  it("accepts valid input", () => {
    const result = saveTemplateSchema.safeParse({
      templateName: "Mon modèle",
      description: "Description optionnelle",
      config: validConfig,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty templateName", () => {
    const result = saveTemplateSchema.safeParse({
      templateName: "",
      config: validConfig,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Le nom du modèle est obligatoire"
      );
    }
  });

  it("rejects templateName over 100 chars", () => {
    const result = saveTemplateSchema.safeParse({
      templateName: "a".repeat(101),
      config: validConfig,
    });
    expect(result.success).toBe(false);
  });

  it("defaults description to empty string", () => {
    const result = saveTemplateSchema.safeParse({
      templateName: "Test",
      config: validConfig,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("");
    }
  });

  it("rejects description over 500 chars", () => {
    const result = saveTemplateSchema.safeParse({
      templateName: "Test",
      description: "a".repeat(501),
      config: validConfig,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateTemplateSchema", () => {
  it("accepts valid input with name only", () => {
    const result = updateTemplateSchema.safeParse({
      templateName: "Mon modèle",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("");
    }
  });

  it("accepts valid input with name and description", () => {
    const result = updateTemplateSchema.safeParse({
      templateName: "Mon modèle",
      description: "Une description",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty templateName", () => {
    const result = updateTemplateSchema.safeParse({
      templateName: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Le nom du modèle est obligatoire"
      );
    }
  });

  it("rejects templateName over 100 chars", () => {
    const result = updateTemplateSchema.safeParse({
      templateName: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects description over 500 chars", () => {
    const result = updateTemplateSchema.safeParse({
      templateName: "Test",
      description: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("does not require config field", () => {
    const result = updateTemplateSchema.safeParse({
      templateName: "Test",
    });
    expect(result.success).toBe(true);
    // config should not be in the result
    if (result.success) {
      expect("config" in result.data).toBe(false);
    }
  });
});

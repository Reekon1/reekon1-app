import { describe, it, expect } from "vitest";
import { reconcile } from "./engine";
import type { ParsedFile, ReconciliationConfig } from "./types";

function makeParsed(
  headers: string[],
  rows: string[][],
  fileName = "test.csv"
): ParsedFile {
  return {
    fileName,
    headers,
    rows,
    totalRows: rows.length,
    totalColumns: headers.length,
  };
}

const baseConfig: ReconciliationConfig = {
  keyColumnsA: [0],
  keyColumnsB: [0],
  amountColumnA: 1,
  amountColumnB: 1,
  excludeHeaderRowsA: 0,
  excludeHeaderRowsB: 0,
  excludeFooterRowsA: 0,
  excludeFooterRowsB: 0,
  deduplication: false,
};

describe("reconcile", () => {
  it("identifies exact matches", () => {
    const fileA = makeParsed(
      ["id", "amount"],
      [
        ["A1", "100"],
        ["A2", "200"],
      ]
    );
    const fileB = makeParsed(
      ["id", "amount"],
      [
        ["A1", "100"],
        ["A2", "200"],
      ]
    );

    const result = reconcile(fileA, fileB, baseConfig);

    expect(result.summary.exactMatches).toBe(2);
    expect(result.summary.amountVariances).toBe(0);
    expect(result.summary.uniqueA).toBe(0);
    expect(result.summary.uniqueB).toBe(0);
  });

  it("identifies amount variances", () => {
    const fileA = makeParsed(["id", "amount"], [["A1", "100"]]);
    const fileB = makeParsed(["id", "amount"], [["A1", "150"]]);

    const result = reconcile(fileA, fileB, baseConfig);

    expect(result.summary.exactMatches).toBe(0);
    expect(result.summary.amountVariances).toBe(1);
    expect(result.amountVariances[0].variance).toBeCloseTo(-50);
  });

  it("identifies unique rows in both directions", () => {
    const fileA = makeParsed(
      ["id", "amount"],
      [
        ["A1", "100"],
        ["A2", "200"],
      ]
    );
    const fileB = makeParsed(
      ["id", "amount"],
      [
        ["A1", "100"],
        ["B3", "300"],
      ]
    );

    const result = reconcile(fileA, fileB, baseConfig);

    expect(result.summary.exactMatches).toBe(1);
    expect(result.summary.uniqueA).toBe(1);
    expect(result.summary.uniqueB).toBe(1);
    expect(result.uniqueA[0].key).toContain("a2");
    expect(result.uniqueB[0].key).toContain("b3");
  });

  it("handles deduplication", () => {
    const fileA = makeParsed(
      ["id", "amount"],
      [
        ["A1", "100"],
        ["A1", "100"],
        ["A2", "200"],
      ]
    );
    const fileB = makeParsed(
      ["id", "amount"],
      [
        ["A1", "100"],
        ["A2", "200"],
      ]
    );

    const result = reconcile(fileA, fileB, {
      ...baseConfig,
      deduplication: true,
    });

    expect(result.summary.duplicatesA).toBe(1);
    expect(result.summary.exactMatches).toBe(2);
  });

  it("handles row exclusions", () => {
    const fileA = makeParsed(
      ["id", "amount"],
      [
        ["HEADER", "EXTRA"],
        ["A1", "100"],
        ["TOTAL", "100"],
      ]
    );
    const fileB = makeParsed(["id", "amount"], [["A1", "100"]]);

    const result = reconcile(fileA, fileB, {
      ...baseConfig,
      excludeHeaderRowsA: 1,
      excludeFooterRowsA: 1,
    });

    expect(result.summary.totalA).toBe(1);
    expect(result.summary.exactMatches).toBe(1);
  });

  it("works without amount columns", () => {
    const fileA = makeParsed(["id"], [["A1"], ["A2"]]);
    const fileB = makeParsed(["id"], [["A1"], ["A3"]]);

    const result = reconcile(fileA, fileB, {
      ...baseConfig,
      amountColumnA: null,
      amountColumnB: null,
    });

    expect(result.summary.exactMatches).toBe(1);
    expect(result.summary.uniqueA).toBe(1);
    expect(result.summary.uniqueB).toBe(1);
  });

  it("handles composite keys", () => {
    const fileA = makeParsed(
      ["date", "supplier", "amount"],
      [["2024-01", "SUP1", "100"]]
    );
    const fileB = makeParsed(
      ["dt", "fournisseur", "montant"],
      [["2024-01", "SUP1", "100"]]
    );

    const result = reconcile(fileA, fileB, {
      ...baseConfig,
      keyColumnsA: [0, 1],
      keyColumnsB: [0, 1],
      amountColumnA: 2,
      amountColumnB: 2,
    });

    expect(result.summary.exactMatches).toBe(1);
  });

  it("calculates match rate correctly", () => {
    const fileA = makeParsed(
      ["id", "amount"],
      [
        ["A1", "100"],
        ["A2", "200"],
        ["A3", "300"],
        ["A4", "400"],
      ]
    );
    const fileB = makeParsed(
      ["id", "amount"],
      [
        ["A1", "100"],
        ["A2", "250"],
        ["A5", "500"],
        ["A6", "600"],
      ]
    );

    const result = reconcile(fileA, fileB, baseConfig);

    // 1 exact + 1 variance = 2 matched, totalA=4, totalB=4
    // matchRate = (2*2) / (4+4) = 50%
    expect(result.summary.matchRate).toBe(50);
  });
});

describe("reconcile with keyTransforms", () => {
  it("alphanumeric_only: matches N°3456 ↔ N3456", () => {
    const fileA = makeParsed(["ref", "amount"], [["N°3456", "100"]]);
    const fileB = makeParsed(["ref", "amount"], [["N3456", "100"]]);

    const result = reconcile(fileA, fileB, {
      ...baseConfig,
      keyTransforms: ["alphanumeric_only"],
    });

    expect(result.summary.exactMatches).toBe(1);
    expect(result.summary.uniqueA).toBe(0);
    expect(result.summary.uniqueB).toBe(0);
  });

  it("alphanumeric_only absent: N°3456 ↔ N3456 does not match", () => {
    const fileA = makeParsed(["ref", "amount"], [["N°3456", "100"]]);
    const fileB = makeParsed(["ref", "amount"], [["N3456", "100"]]);

    const result = reconcile(fileA, fileB, baseConfig);

    expect(result.summary.exactMatches).toBe(0);
    expect(result.summary.uniqueA).toBe(1);
    expect(result.summary.uniqueB).toBe(1);
  });

  it("extract_code_prefix: matches CNFFOKTOS – OKTOS ↔ CNFFOKTOS", () => {
    const fileA = makeParsed(["code", "amount"], [["CNFFOKTOS – OKTOS", "100"]]);
    const fileB = makeParsed(["code", "amount"], [["CNFFOKTOS", "100"]]);

    const result = reconcile(fileA, fileB, {
      ...baseConfig,
      keyTransforms: ["extract_code_prefix"],
    });

    expect(result.summary.exactMatches).toBe(1);
  });

  it("extract_code_prefix: matches value without separator as-is", () => {
    const fileA = makeParsed(["code", "amount"], [["CNFFOKTOS", "100"]]);
    const fileB = makeParsed(["code", "amount"], [["CNFFOKTOS", "100"]]);

    const result = reconcile(fileA, fileB, {
      ...baseConfig,
      keyTransforms: ["extract_code_prefix"],
    });

    expect(result.summary.exactMatches).toBe(1);
  });

  it("absolute_amount: matches -1234.56 ↔ 1234.56", () => {
    const fileA = makeParsed(["ref", "amount"], [["INV001", "-1234.56"]]);
    const fileB = makeParsed(["ref", "amount"], [["INV001", "1234.56"]]);

    const result = reconcile(fileA, fileB, {
      ...baseConfig,
      keyTransforms: ["default", "absolute_amount"],
      keyColumnsA: [0, 1],
      keyColumnsB: [0, 1],
      amountColumnA: null,
      amountColumnB: null,
    });

    expect(result.summary.exactMatches).toBe(1);
  });

  it("composite key with mixed transforms", () => {
    const fileA = makeParsed(
      ["ref", "code", "date"],
      [["N°3456", "CNFFOKTOS – OKTOS", "2024-01"]]
    );
    const fileB = makeParsed(
      ["ref", "code", "date"],
      [["N3456", "CNFFOKTOS", "2024-01"]]
    );

    const result = reconcile(fileA, fileB, {
      ...baseConfig,
      keyColumnsA: [0, 1, 2],
      keyColumnsB: [0, 1, 2],
      amountColumnA: null,
      amountColumnB: null,
      keyTransforms: ["alphanumeric_only", "extract_code_prefix", "default"],
    });

    expect(result.summary.exactMatches).toBe(1);
  });

  it("keyTransforms: undefined behaves same as omitting the field", () => {
    const fileA = makeParsed(["id", "amount"], [["A1", "100"]]);
    const fileB = makeParsed(["id", "amount"], [["A1", "100"]]);

    const withUndefined = reconcile(fileA, fileB, {
      ...baseConfig,
      keyTransforms: undefined,
    });
    const withoutField = reconcile(fileA, fileB, baseConfig);

    expect(withUndefined.summary.exactMatches).toBe(withoutField.summary.exactMatches);
    expect(withUndefined.summary.uniqueA).toBe(withoutField.summary.uniqueA);
  });

  it("partial transforms array: missing positions default to 'default'", () => {
    const fileA = makeParsed(["ref", "code"], [["N°3456", "SUP1"]]);
    const fileB = makeParsed(["ref", "code"], [["n3456", "SUP1"]]);

    // Only one transform specified for two columns; second position defaults to "default"
    const result = reconcile(fileA, fileB, {
      ...baseConfig,
      keyColumnsA: [0, 1],
      keyColumnsB: [0, 1],
      amountColumnA: null,
      amountColumnB: null,
      keyTransforms: ["alphanumeric_only"],
    });

    expect(result.summary.exactMatches).toBe(1);
  });
});

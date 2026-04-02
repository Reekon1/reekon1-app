import { describe, it, expect } from "vitest";
import { reconcile } from "./engine";
import type { ParsedFile, ReconciliationConfig, KeyMapping } from "./types";
import { legacyToKeyMappings, buildKeyFromMappings } from "./normalizer";

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

function mapping(
  colsA: number[],
  colsB: number[],
  separator = "",
  transform: KeyMapping["transform"] = "default"
): KeyMapping {
  return { colsA, colsB, separator, transform };
}

const baseConfig: ReconciliationConfig = {
  keyMappings: [mapping([0], [0])],
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

  it("handles composite keys (multiple mappings)", () => {
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
      keyMappings: [mapping([0], [0]), mapping([1], [1])],
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
  it("alphanumeric_only: matches N°3456 <-> N3456", () => {
    const fileA = makeParsed(["ref", "amount"], [["N°3456", "100"]]);
    const fileB = makeParsed(["ref", "amount"], [["N3456", "100"]]);

    const result = reconcile(fileA, fileB, {
      ...baseConfig,
      keyMappings: [mapping([0], [0], "", "alphanumeric_only")],
    });

    expect(result.summary.exactMatches).toBe(1);
    expect(result.summary.uniqueA).toBe(0);
    expect(result.summary.uniqueB).toBe(0);
  });

  it("alphanumeric_only absent: N°3456 <-> N3456 does not match", () => {
    const fileA = makeParsed(["ref", "amount"], [["N°3456", "100"]]);
    const fileB = makeParsed(["ref", "amount"], [["N3456", "100"]]);

    const result = reconcile(fileA, fileB, baseConfig);

    expect(result.summary.exactMatches).toBe(0);
    expect(result.summary.uniqueA).toBe(1);
    expect(result.summary.uniqueB).toBe(1);
  });

  it("extract_code_prefix: matches CNFFOKTOS - OKTOS <-> CNFFOKTOS", () => {
    const fileA = makeParsed(["code", "amount"], [["CNFFOKTOS \u2013 OKTOS", "100"]]);
    const fileB = makeParsed(["code", "amount"], [["CNFFOKTOS", "100"]]);

    const result = reconcile(fileA, fileB, {
      ...baseConfig,
      keyMappings: [mapping([0], [0], "", "extract_code_prefix")],
    });

    expect(result.summary.exactMatches).toBe(1);
  });

  it("absolute_amount: matches -1234.56 <-> 1234.56 as key", () => {
    const fileA = makeParsed(["ref", "amount"], [["INV001", "-1234.56"]]);
    const fileB = makeParsed(["ref", "amount"], [["INV001", "1234.56"]]);

    const result = reconcile(fileA, fileB, {
      ...baseConfig,
      keyMappings: [
        mapping([0], [0]),
        mapping([1], [1], "", "absolute_amount"),
      ],
      amountColumnA: null,
      amountColumnB: null,
    });

    expect(result.summary.exactMatches).toBe(1);
  });

  it("composite key with mixed transforms", () => {
    const fileA = makeParsed(
      ["ref", "code", "date"],
      [["N°3456", "CNFFOKTOS \u2013 OKTOS", "2024-01"]]
    );
    const fileB = makeParsed(
      ["ref", "code", "date"],
      [["N3456", "CNFFOKTOS", "2024-01"]]
    );

    const result = reconcile(fileA, fileB, {
      ...baseConfig,
      keyMappings: [
        mapping([0], [0], "", "alphanumeric_only"),
        mapping([1], [1], "", "extract_code_prefix"),
        mapping([2], [2]),
      ],
      amountColumnA: null,
      amountColumnB: null,
    });

    expect(result.summary.exactMatches).toBe(1);
  });
});

describe("asymmetric keys (1:N)", () => {
  it("matches 1 column vs 3 columns with separator", () => {
    // File A has "PARIS-2024-001" in one column
    // File B has "PARIS", "2024", "001" in three columns
    const fileA = makeParsed(
      ["reference", "amount"],
      [["PARIS-2024-001", "100"]]
    );
    const fileB = makeParsed(
      ["ville", "annee", "numero", "amount"],
      [["PARIS", "2024", "001", "100"]]
    );

    const result = reconcile(fileA, fileB, {
      ...baseConfig,
      keyMappings: [mapping([0], [0, 1, 2], "-")],
      amountColumnA: 1,
      amountColumnB: 3,
    });

    expect(result.summary.exactMatches).toBe(1);
    expect(result.summary.uniqueA).toBe(0);
    expect(result.summary.uniqueB).toBe(0);
  });

  it("matches N:M (2 cols A, 3 cols B)", () => {
    // A: "PARIS" + "2024" joined with "-" = "paris-2024"
    // B: "PA" + "RIS" + "2024" joined with "" then "-" ... actually let's be simpler
    // A: cols [0,1] with sep "-" = "paris-2024"
    // B: cols [0,1,2] with sep "" = "paris-2024" (if B has "paris", "", "2024" — no)
    // Better: separate key groups
    const fileA = makeParsed(
      ["city", "year"],
      [["PARIS", "2024"]]
    );
    const fileB = makeParsed(
      ["city_code", "city_name", "year"],
      [["PAR", "IS", "2024"]]
    );

    // Use 2 key groups: city (2 cols B joined = "paris") vs (1 col A = "paris")
    // and year (1:1)
    const result = reconcile(fileA, fileB, {
      ...baseConfig,
      keyMappings: [
        mapping([0], [0, 1]),  // "paris" vs "par" + "is" = "paris"
        mapping([1], [2]),     // "2024" vs "2024"
      ],
      amountColumnA: null,
      amountColumnB: null,
    });

    expect(result.summary.exactMatches).toBe(1);
  });

  it("deduplication works with asymmetric keys", () => {
    const fileA = makeParsed(
      ["reference"],
      [
        ["PARIS-2024-001"],
        ["PARIS-2024-001"],
        ["LYON-2024-002"],
      ]
    );
    const fileB = makeParsed(
      ["ville", "annee", "numero"],
      [
        ["PARIS", "2024", "001"],
        ["LYON", "2024", "002"],
      ]
    );

    const result = reconcile(fileA, fileB, {
      ...baseConfig,
      keyMappings: [mapping([0], [0, 1, 2], "-")],
      amountColumnA: null,
      amountColumnB: null,
      deduplication: true,
    });

    expect(result.summary.duplicatesA).toBe(1);
    expect(result.summary.exactMatches).toBe(2);
  });
});

describe("buildKeyFromMappings guards", () => {
  it("throws on empty colsA", () => {
    expect(() =>
      buildKeyFromMappings(["val"], [mapping([], [0])], "A")
    ).toThrow("KeyMapping has no columns for side A");
  });

  it("throws on empty colsB", () => {
    expect(() =>
      buildKeyFromMappings(["val"], [mapping([0], [])], "B")
    ).toThrow("KeyMapping has no columns for side B");
  });

  it("handles out-of-bounds column gracefully (empty string)", () => {
    const key = buildKeyFromMappings(["a", "b"], [mapping([999], [0])], "A");
    // row[999] is undefined, applyTransform gets "" → normalizeKey returns ""
    expect(key).toBe("");
  });
});

describe("legacyToKeyMappings", () => {
  it("converts 1:1 legacy format", () => {
    const mappings = legacyToKeyMappings([0], [0]);
    expect(mappings).toEqual([
      { colsA: [0], colsB: [0], separator: "", transform: "default" },
    ]);
  });

  it("converts multi-key legacy format with transforms", () => {
    const mappings = legacyToKeyMappings(
      [0, 1],
      [0, 1],
      ["alphanumeric_only", "default"],
      "-"
    );
    expect(mappings).toHaveLength(2);
    expect(mappings[0].transform).toBe("alphanumeric_only");
    expect(mappings[1].separator).toBe("-");
  });

  it("throws on mismatched array lengths", () => {
    expect(() => legacyToKeyMappings([0, 1], [0])).toThrow(
      "Mismatched key column arrays: A=2, B=1"
    );
  });

  it("produces same reconciliation result as direct keyMappings", () => {
    const fileA = makeParsed(["id", "amount"], [["A1", "100"]]);
    const fileB = makeParsed(["id", "amount"], [["A1", "100"]]);

    const legacyMappings = legacyToKeyMappings([0], [0]);
    const directConfig: ReconciliationConfig = {
      ...baseConfig,
      keyMappings: legacyMappings,
    };

    const result = reconcile(fileA, fileB, directConfig);
    expect(result.summary.exactMatches).toBe(1);
  });
});

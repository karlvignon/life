import { describe, expect, it } from "vitest";
import { EncodedPattern } from "./EncodedPattern";
import { parsePatternEncoding } from "./PatternEncoding";

describe("parsePatternEncoding", () => {
  it("parses cells row by row and preserves declared dead borders", () => {
    const definition = parsePatternEncoding("x=3;y=3;cells=000010010");
    const pattern = new EncodedPattern("sprout", definition);

    expect(pattern.getCells()).toEqual([
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ]);
    expect(pattern.getBounds()).toEqual({ width: 3, height: 3 });
  });

  it.each([
    "3x3:000010010",
    "x=3;y=3;000010010",
    "x=3; y=3;cells=000010010",
    "x=-3;y=3;cells=000010010",
    "x=3.5;y=3;cells=000010010",
  ])("rejects the malformed structure %s", (encoding) => {
    expect(() => parsePatternEncoding(encoding)).toThrow(SyntaxError);
  });

  it.each([
    "x=0;y=2;cells=1",
    "x=2;y=0;cells=1",
    "x=9007199254740992;y=1;cells=1",
  ])("rejects invalid dimensions in %s", (encoding) => {
    expect(() => parsePatternEncoding(encoding)).toThrow(RangeError);
  });

  it.each(["x=2;y=2;cells=10a1", "x=2;y=2;cells=10 1"])(
    "rejects non-binary cells in %s",
    (encoding) => {
      expect(() => parsePatternEncoding(encoding)).toThrow(SyntaxError);
    },
  );

  it.each(["x=2;y=2;cells=101", "x=2;y=2;cells=10101"])(
    "rejects the wrong number of cells in %s",
    (encoding) => {
      expect(() => parsePatternEncoding(encoding)).toThrow("exactly 4 bits");
    },
  );

  it("rejects a pattern without a living cell", () => {
    expect(() => parsePatternEncoding("x=2;y=2;cells=0000")).toThrow(
      "at least one living cell",
    );
  });

  it("returns immutable parsed data", () => {
    const definition = parsePatternEncoding("x=1;y=1;cells=1");

    expect(Object.isFrozen(definition)).toBe(true);
    expect(Object.isFrozen(definition.cells)).toBe(true);
    expect(Object.isFrozen(definition.cells[0])).toBe(true);
  });
});

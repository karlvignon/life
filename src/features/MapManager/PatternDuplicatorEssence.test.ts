import { describe, expect, it } from "vitest";
import { packIndex } from "../../core/types/grid";
import type { EssenceEvolutionInput } from "./model/essences/Essence";
import { PatternDuplicatorEssence } from "./model/essences/PatternDuplicatorEssence";

class TestPatternEssence extends PatternDuplicatorEssence {
  readonly id = "static";
  readonly name = "Test pattern";

  constructor(pattern: ReadonlyArray<{ x: number; y: number }>) {
    super(0xffffff, pattern);
  }
}

const bounds = { width: 7, height: 7 };

function makeInput(
  essenceCells: ReadonlyArray<{ x: number; y: number }>,
  otherCells: ReadonlyArray<{ x: number; y: number }> = [],
): EssenceEvolutionInput {
  const aliveIndices = new Set(
    essenceCells.map(({ x, y }) => packIndex(x, y, bounds.width)),
  );
  const globalLivingIndices = new Set(aliveIndices);
  for (const { x, y } of otherCells) {
    globalLivingIndices.add(packIndex(x, y, bounds.width));
  }

  return { bounds, aliveIndices, globalLivingIndices, currentCycle: 1 };
}

describe("PatternDuplicatorEssence", () => {
  const diamondPattern = [
    { x: 0, y: -1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ];

  it("births the empty center of a complete pattern", () => {
    const essence = new TestPatternEssence(diamondPattern);
    const result = essence.evolve(
      makeInput([
        { x: 3, y: 2 },
        { x: 2, y: 3 },
        { x: 4, y: 3 },
        { x: 3, y: 4 },
      ]),
    );

    expect(result.aliveIndices).toContain(packIndex(3, 3, bounds.width));
  });

  it("does not birth from an incomplete pattern", () => {
    const essence = new TestPatternEssence(diamondPattern);
    const result = essence.evolve(
      makeInput([
        { x: 3, y: 2 },
        { x: 2, y: 3 },
        { x: 4, y: 3 },
      ]),
    );

    expect(result.aliveIndices).not.toContain(packIndex(3, 3, bounds.width));
  });

  it("does not replace another essence at the birth center", () => {
    const essence = new TestPatternEssence(diamondPattern);
    const result = essence.evolve(
      makeInput(
        [
          { x: 3, y: 2 },
          { x: 2, y: 3 },
          { x: 4, y: 3 },
          { x: 3, y: 4 },
        ],
        [{ x: 3, y: 3 }],
      ),
    );

    expect(result.aliveIndices).not.toContain(packIndex(3, 3, bounds.width));
  });

  it("keeps all existing cells alive", () => {
    const essence = new TestPatternEssence(diamondPattern);
    const input = makeInput([{ x: 1, y: 1 }]);

    expect(essence.evolve(input).aliveIndices).toEqual([...input.aliveIndices]);
  });

  it("does not wrap a pattern across grid edges", () => {
    const essence = new TestPatternEssence([
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ]);
    const result = essence.evolve(
      makeInput([
        { x: 6, y: 2 },
        { x: 1, y: 3 },
      ]),
    );

    expect(result.aliveIndices).not.toContain(packIndex(0, 3, bounds.width));
  });

  it("validates and freezes its pattern", () => {
    expect(() => new TestPatternEssence([])).toThrow(RangeError);
    expect(() => new TestPatternEssence([{ x: 0, y: 0 }])).toThrow(RangeError);
    expect(
      () =>
        new TestPatternEssence([
          { x: 1, y: 0 },
          { x: 1, y: 0 },
        ]),
    ).toThrow(RangeError);

    const essence = new TestPatternEssence(diamondPattern);
    expect(Object.isFrozen(essence.getBirthPattern())).toBe(true);
    expect(Object.isFrozen(essence.getBirthPattern()[0])).toBe(true);
  });
});

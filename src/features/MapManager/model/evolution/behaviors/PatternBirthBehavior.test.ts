import { describe, expect, it } from "vitest";
import { packIndex } from "../../../../../core/types/grid";
import { Essence, type EssenceEvolutionInput } from "../../essences/Essence";
import {
  createPatternBirthBehavior,
  freezeBirthPattern,
  type BirthPattern,
} from "./PatternBirthBehavior";

const bounds = { width: 7, height: 7 };
const diamondPattern: BirthPattern = [
  { x: 0, y: -1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
];

function createPatternEssence(pattern: BirthPattern): Essence {
  return new Essence({
    id: "test-pattern",
    name: "Test pattern",
    color: 0xffffff,
    evolutionBehaviors: [createPatternBirthBehavior("test-birth", pattern)],
  });
}

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

describe("PatternBirthBehavior", () => {
  it("births the empty center of a complete pattern", () => {
    const result = createPatternEssence(diamondPattern).evolve(
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
    const result = createPatternEssence(diamondPattern).evolve(
      makeInput([
        { x: 3, y: 2 },
        { x: 2, y: 3 },
        { x: 4, y: 3 },
      ]),
    );

    expect(result.aliveIndices).not.toContain(packIndex(3, 3, bounds.width));
  });

  it("does not replace another essence at the birth center", () => {
    const result = createPatternEssence(diamondPattern).evolve(
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

  it("keeps existing cells and does not wrap across grid edges", () => {
    const input = makeInput([{ x: 1, y: 1 }]);
    expect(
      createPatternEssence(diamondPattern).evolve(input).aliveIndices,
    ).toEqual([...input.aliveIndices]);

    const edgeResult = createPatternEssence([
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ]).evolve(
      makeInput([
        { x: 6, y: 2 },
        { x: 1, y: 3 },
      ]),
    );
    expect(edgeResult.aliveIndices).not.toContain(
      packIndex(0, 3, bounds.width),
    );
  });

  it("validates and freezes patterns", () => {
    expect(() => freezeBirthPattern([])).toThrow(RangeError);
    expect(() => freezeBirthPattern([{ x: 0, y: 0 }])).toThrow(RangeError);
    expect(() =>
      freezeBirthPattern([
        { x: 1, y: 0 },
        { x: 1, y: 0 },
      ]),
    ).toThrow(RangeError);

    const frozen = freezeBirthPattern(diamondPattern);
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen[0])).toBe(true);
  });
});

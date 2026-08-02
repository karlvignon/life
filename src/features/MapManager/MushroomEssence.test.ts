import { describe, expect, it } from "vitest";
import {
  DEFAULT_MUSHROOM_COLOR,
  MushroomEssence,
} from "./model/essences/MushroomEssence";
import type { EssenceEvolutionInput } from "./model/essences/Essence";

function baseInput(
  overrides: Partial<EssenceEvolutionInput> = {},
): EssenceEvolutionInput {
  return {
    gridWidth: 7,
    gridHeight: 7,
    aliveCells: [],
    currentCycle: 50,
    otherEssenceCells: [],
    ...overrides,
  };
}

describe("MushroomEssence", () => {
  const essence = new MushroomEssence();

  it("uses the default brown color", () => {
    expect(essence.color).toBe(DEFAULT_MUSHROOM_COLOR);
  });

  it("allows overriding the color", () => {
    const custom = new MushroomEssence(0xff0000);
    expect(custom.color).toBe(0xff0000);
  });

  it("keeps cells unchanged outside propagation cycles", () => {
    const result = essence.evolve(
      baseInput({
        currentCycle: 49,
        aliveCells: [{ x: 3, y: 3 }],
      }),
    );

    expect(result.aliveCells).toEqual([{ x: 3, y: 3 }]);
  });

  it("births an empty cell with exactly 3 connected mushroom neighbors", () => {
    const result = essence.evolve(
      baseInput({
        aliveCells: [
          { x: 2, y: 2 },
          { x: 3, y: 2 },
          { x: 2, y: 3 },
        ],
      }),
    );

    expect(result.aliveCells).toContainEqual({ x: 3, y: 3 });
  });

  it("does not birth when mushroom neighbors are not connected", () => {
    const result = essence.evolve(
      baseInput({
        aliveCells: [
          { x: 1, y: 1 },
          { x: 3, y: 1 },
          { x: 1, y: 3 },
        ],
      }),
    );

    expect(result.aliveCells).not.toContainEqual({ x: 2, y: 2 });
    expect(result.aliveCells).toHaveLength(3);
  });

  it("kills a mushroom surrounded by a connected enemy group of 3", () => {
    const result = essence.evolve(
      baseInput({
        aliveCells: [{ x: 3, y: 3 }],
        otherEssenceCells: [
          { x: 2, y: 2 },
          { x: 3, y: 2 },
          { x: 2, y: 3 },
        ],
      }),
    );

    expect(result.aliveCells).toEqual([]);
  });

  it("survives when enemy neighbors lack a connected group of 3", () => {
    const result = essence.evolve(
      baseInput({
        aliveCells: [{ x: 3, y: 3 }],
        otherEssenceCells: [
          { x: 1, y: 1 },
          { x: 3, y: 1 },
          { x: 1, y: 3 },
        ],
      }),
    );

    expect(result.aliveCells).toEqual([{ x: 3, y: 3 }]);
  });

  it("ignores neighbors outside grid bounds", () => {
    const result = essence.evolve(
      baseInput({
        gridWidth: 3,
        gridHeight: 3,
        aliveCells: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
        ],
      }),
    );

    expect(result.aliveCells).toContainEqual({ x: 1, y: 1 });
  });
});

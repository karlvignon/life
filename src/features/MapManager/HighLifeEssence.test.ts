import { describe, expect, it } from "vitest";
import {
  DEFAULT_HIGHLIFE_COLOR,
  HighLifeEssence,
} from "./model/essences/HighLifeEssence";
import { GameOfLifeEssence } from "./model/essences/GameOfLifeEssence";

describe("HighLifeEssence", () => {
  const essence = new HighLifeEssence();

  it("uses the default blue color", () => {
    expect(essence.color).toBe(DEFAULT_HIGHLIFE_COLOR);
  });

  it("allows overriding the color", () => {
    const custom = new HighLifeEssence(0x123456);
    expect(custom.color).toBe(0x123456);
  });

  it("births a dead cell with exactly 6 neighbors", () => {
    const result = essence.evolve({
      gridWidth: 5,
      gridHeight: 5,
      aliveCells: [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 1, y: 2 },
        { x: 3, y: 2 },
        { x: 1, y: 3 },
      ],
      currentCycle: 1,
      otherEssenceCells: [],
    });

    expect(result.aliveCells).toContainEqual({ x: 2, y: 2 });
  });

  it("does not birth with 6 neighbors under Conway rules", () => {
    const conway = new GameOfLifeEssence();
    const result = conway.evolve({
      gridWidth: 5,
      gridHeight: 5,
      aliveCells: [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 1, y: 2 },
        { x: 3, y: 2 },
        { x: 1, y: 3 },
      ],
      currentCycle: 1,
      otherEssenceCells: [],
    });

    expect(result.aliveCells).not.toContainEqual({ x: 2, y: 2 });
  });
});

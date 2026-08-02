import { describe, expect, it } from "vitest";
import {
  DEFAULT_GAME_OF_LIFE_COLOR,
  GameOfLifeEssence,
} from "./model/essences/GameOfLifeEssence";

describe("GameOfLifeEssence", () => {
  const essence = new GameOfLifeEssence();

  it("uses the default green color", () => {
    expect(essence.color).toBe(DEFAULT_GAME_OF_LIFE_COLOR);
  });

  it("allows overriding the color", () => {
    const custom = new GameOfLifeEssence(0xff0000);
    expect(custom.color).toBe(0xff0000);
  });

  it("keeps a live cell with 2 neighbors", () => {
    const result = essence.evolve({
      gridWidth: 5,
      gridHeight: 5,
      aliveCells: [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 1, y: 2 },
      ],
      currentCycle: 1,
      otherEssenceCells: [],
    });

    expect(result.aliveCells).toContainEqual({ x: 1, y: 1 });
  });

  it("kills a live cell with fewer than 2 neighbors", () => {
    const result = essence.evolve({
      gridWidth: 5,
      gridHeight: 5,
      aliveCells: [{ x: 2, y: 2 }],
      currentCycle: 1,
      otherEssenceCells: [],
    });

    expect(result.aliveCells).toEqual([]);
  });

  it("births a dead cell with exactly 3 neighbors", () => {
    const result = essence.evolve({
      gridWidth: 5,
      gridHeight: 5,
      aliveCells: [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 1, y: 2 },
      ],
      currentCycle: 1,
      otherEssenceCells: [],
    });

    expect(result.aliveCells).toContainEqual({ x: 2, y: 2 });
  });

  it("ignores neighbors outside grid bounds", () => {
    const result = essence.evolve({
      gridWidth: 1,
      gridHeight: 3,
      aliveCells: [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
      ],
      currentCycle: 1,
      otherEssenceCells: [],
    });

    expect(result.aliveCells).toEqual([{ x: 0, y: 1 }]);
  });
});

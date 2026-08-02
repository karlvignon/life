import { describe, expect, it } from "vitest";
import {
  DEFAULT_GAME_OF_LIFE_COLOR,
  GameOfLifeEssence,
  makeGameOfLifeInput,
  unpackAliveCells,
} from "./model/essences/GameOfLifeEssence";

describe("GameOfLifeEssence", () => {
  const essence = new GameOfLifeEssence();
  const bounds = { width: 5, height: 5 };

  it("uses the default green color", () => {
    expect(essence.color).toBe(DEFAULT_GAME_OF_LIFE_COLOR);
  });

  it("allows overriding the color", () => {
    const custom = new GameOfLifeEssence(0xff0000);
    expect(custom.color).toBe(0xff0000);
  });

  it("keeps a live cell with 2 neighbors", () => {
    const result = essence.evolve(
      makeGameOfLifeInput(bounds, [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 1, y: 2 },
      ]),
    );

    expect(unpackAliveCells(result.aliveIndices, bounds.width)).toContainEqual({
      x: 1,
      y: 1,
    });
  });

  it("kills a live cell with fewer than 2 neighbors", () => {
    const result = essence.evolve(
      makeGameOfLifeInput(bounds, [{ x: 2, y: 2 }]),
    );

    expect(result.aliveIndices).toEqual([]);
  });

  it("births a dead cell with exactly 3 neighbors", () => {
    const result = essence.evolve(
      makeGameOfLifeInput(bounds, [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 1, y: 2 },
      ]),
    );

    expect(unpackAliveCells(result.aliveIndices, bounds.width)).toContainEqual({
      x: 2,
      y: 2,
    });
  });

  it("ignores neighbors outside grid bounds", () => {
    const narrowBounds = { width: 1, height: 3 };
    const result = essence.evolve(
      makeGameOfLifeInput(narrowBounds, [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
      ]),
    );

    expect(unpackAliveCells(result.aliveIndices, narrowBounds.width)).toEqual([
      { x: 0, y: 1 },
    ]);
  });
});

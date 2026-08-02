import { describe, expect, it } from "vitest";
import {
  DEFAULT_HIGHLIFE_COLOR,
  HighLifeEssence,
} from "./model/essences/HighLifeEssence";
import {
  GameOfLifeEssence,
  makeGameOfLifeInput,
  unpackAliveCells,
} from "./model/essences/GameOfLifeEssence";

describe("HighLifeEssence", () => {
  const essence = new HighLifeEssence();
  const bounds = { width: 5, height: 5 };

  it("uses the default blue color", () => {
    expect(essence.color).toBe(DEFAULT_HIGHLIFE_COLOR);
  });

  it("allows overriding the color", () => {
    const custom = new HighLifeEssence(0x123456);
    expect(custom.color).toBe(0x123456);
  });

  it("births a dead cell with exactly 6 neighbors", () => {
    const result = essence.evolve(
      makeGameOfLifeInput(bounds, [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 1, y: 2 },
        { x: 3, y: 2 },
        { x: 1, y: 3 },
      ]),
    );

    expect(unpackAliveCells(result.aliveIndices, bounds.width)).toContainEqual({
      x: 2,
      y: 2,
    });
  });

  it("does not birth with 6 neighbors under Conway rules", () => {
    const conway = new GameOfLifeEssence();
    const result = conway.evolve(
      makeGameOfLifeInput(bounds, [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 1, y: 2 },
        { x: 3, y: 2 },
        { x: 1, y: 3 },
      ]),
    );

    expect(
      unpackAliveCells(result.aliveIndices, bounds.width),
    ).not.toContainEqual({ x: 2, y: 2 });
  });
});

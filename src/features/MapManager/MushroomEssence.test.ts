import { describe, expect, it } from "vitest";
import {
  DEFAULT_MUSHROOM_COLOR,
  makeMushroomInput,
  MushroomEssence,
} from "./model/essences/MushroomEssence";
import { unpackAliveCells } from "./model/essences/GameOfLifeEssence";

describe("MushroomEssence", () => {
  const essence = new MushroomEssence();
  const bounds = { width: 7, height: 7 };

  it("uses the default brown color", () => {
    expect(essence.color).toBe(DEFAULT_MUSHROOM_COLOR);
  });

  it("allows overriding the color", () => {
    const custom = new MushroomEssence(0xff0000);
    expect(custom.color).toBe(0xff0000);
  });

  it("keeps cells unchanged outside propagation cycles", () => {
    const result = essence.evolve(
      makeMushroomInput(bounds, [{ x: 3, y: 3 }], [], 49),
    );

    expect(unpackAliveCells(result.aliveIndices, bounds.width)).toEqual([
      { x: 3, y: 3 },
    ]);
  });

  it("births an empty cell with exactly 3 connected mushroom neighbors", () => {
    const result = essence.evolve(
      makeMushroomInput(bounds, [
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 2, y: 3 },
      ]),
    );

    expect(unpackAliveCells(result.aliveIndices, bounds.width)).toContainEqual({
      x: 3,
      y: 3,
    });
  });

  it("does not birth when mushroom neighbors are not connected", () => {
    const result = essence.evolve(
      makeMushroomInput(bounds, [
        { x: 1, y: 1 },
        { x: 3, y: 1 },
        { x: 1, y: 3 },
      ]),
    );

    expect(
      unpackAliveCells(result.aliveIndices, bounds.width),
    ).not.toContainEqual({ x: 2, y: 2 });
    expect(result.aliveIndices).toHaveLength(3);
  });

  it("kills a mushroom surrounded by a connected enemy group of 3", () => {
    const result = essence.evolve(
      makeMushroomInput(
        bounds,
        [{ x: 3, y: 3 }],
        [
          { x: 2, y: 2 },
          { x: 3, y: 2 },
          { x: 2, y: 3 },
        ],
      ),
    );

    expect(result.aliveIndices).toEqual([]);
  });

  it("survives when enemy neighbors lack a connected group of 3", () => {
    const result = essence.evolve(
      makeMushroomInput(
        bounds,
        [{ x: 3, y: 3 }],
        [
          { x: 1, y: 1 },
          { x: 3, y: 1 },
          { x: 1, y: 3 },
        ],
      ),
    );

    expect(unpackAliveCells(result.aliveIndices, bounds.width)).toEqual([
      { x: 3, y: 3 },
    ]);
  });

  it("ignores neighbors outside grid bounds", () => {
    const narrowBounds = { width: 3, height: 3 };
    const result = essence.evolve(
      makeMushroomInput(
        narrowBounds,
        [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
        ],
        [],
        50,
      ),
    );

    expect(
      unpackAliveCells(result.aliveIndices, narrowBounds.width),
    ).toContainEqual({ x: 1, y: 1 });
  });
});

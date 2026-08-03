import { describe, expect, it } from "vitest";
import {
  DEFAULT_MUSHROOM_COLOR,
  makeMushroomInput,
  MUSHROOM_COLD_LIFE_LOSS,
  MUSHROOM_COLD_THRESHOLD_DEGREES,
  MUSHROOM_WEATHER_REPERCUSSION_INTERVAL,
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

  it("keeps weather out of births and deaths", () => {
    const result = essence.evolve(
      makeMushroomInput(bounds, [{ x: 3, y: 3 }], [], 50),
    );

    expect(unpackAliveCells(result.aliveIndices, bounds.width)).toEqual([
      { x: 3, y: 3 },
    ]);
  });

  it("returns a life loss every 10 cycles below 25 degrees", () => {
    const mushroom = new MushroomEssence();

    const delta = mushroom.getWeatherRepercussion({
      cycle: MUSHROOM_WEATHER_REPERCUSSION_INTERVAL,
      season: "Winter",
      windStrength: 0,
      degrees: MUSHROOM_COLD_THRESHOLD_DEGREES - 0.1,
    });

    expect(delta).toEqual({ life: -MUSHROOM_COLD_LIFE_LOSS });
  });

  it("does not lose life outside cold weather intervals", () => {
    const mushroom = new MushroomEssence();
    const baseWeather = {
      season: "Spring" as const,
      windStrength: 0,
      degrees: MUSHROOM_COLD_THRESHOLD_DEGREES - 0.1,
    };

    expect(
      mushroom.getWeatherRepercussion({ ...baseWeather, cycle: 9 }),
    ).toEqual({ life: 0 });
    expect(
      mushroom.getWeatherRepercussion({
        ...baseWeather,
        cycle: MUSHROOM_WEATHER_REPERCUSSION_INTERVAL,
        degrees: MUSHROOM_COLD_THRESHOLD_DEGREES,
      }),
    ).toEqual({ life: 0 });
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

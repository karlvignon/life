import { describe, expect, it } from "vitest";
import {
  DEFAULT_MUSHROOM_COLOR,
  makeMushroomInput,
  MUSHROOM_BIRTH_PATTERN,
  MUSHROOM_COLD_LIFE_LOSS,
  MUSHROOM_COLD_THRESHOLD_DEGREES,
  MUSHROOM_WEATHER_REPERCUSSION_INTERVAL,
  MushroomEssence,
} from "./model/essences/MushroomEssence";
import { unpackAliveCells } from "./model/essences/GameOfLifeEssence";

describe("MushroomEssence", () => {
  const essence = new MushroomEssence();
  const bounds = { width: 9, height: 9 };

  it("uses its default color and supports a custom color", () => {
    expect(essence.color).toBe(DEFAULT_MUSHROOM_COLOR);
    expect(new MushroomEssence(0xff0000).color).toBe(0xff0000);
  });

  it("uses the orthogonal cross birth pattern", () => {
    expect(essence.getBirthPattern()).toEqual(MUSHROOM_BIRTH_PATTERN);
    expect(MUSHROOM_BIRTH_PATTERN).toEqual([
      { x: 0, y: -1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ]);
  });

  it("births the center when the complete mushroom pattern is placed", () => {
    const center = { x: 4, y: 4 };
    const alive = MUSHROOM_BIRTH_PATTERN.map((offset) => ({
      x: center.x + offset.x,
      y: center.y + offset.y,
    }));
    const result = essence.evolve(makeMushroomInput(bounds, alive));

    expect(unpackAliveCells(result.aliveIndices, bounds.width)).toContainEqual(
      center,
    );
  });

  it("does not birth when one mushroom is missing", () => {
    const center = { x: 4, y: 4 };
    const alive = MUSHROOM_BIRTH_PATTERN.slice(1).map((offset) => ({
      x: center.x + offset.x,
      y: center.y + offset.y,
    }));
    const result = essence.evolve(makeMushroomInput(bounds, alive));

    expect(
      unpackAliveCells(result.aliveIndices, bounds.width),
    ).not.toContainEqual(center);
  });

  it("does not use the former three-neighbor propagation rule", () => {
    const alive = [
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 3, y: 4 },
    ];
    const result = essence.evolve(makeMushroomInput(bounds, alive));

    expect(result.aliveIndices).toHaveLength(alive.length);
    expect(
      unpackAliveCells(result.aliveIndices, bounds.width),
    ).not.toContainEqual({ x: 4, y: 4 });
  });

  it("does not die when surrounded by enemy cells", () => {
    const result = essence.evolve(
      makeMushroomInput(
        bounds,
        [{ x: 4, y: 4 }],
        [
          { x: 3, y: 3 },
          { x: 4, y: 3 },
          { x: 3, y: 4 },
        ],
      ),
    );

    expect(unpackAliveCells(result.aliveIndices, bounds.width)).toEqual([
      { x: 4, y: 4 },
    ]);
  });

  it("returns a life loss every 10 cycles below 25 degrees", () => {
    const delta = essence.getWeatherRepercussion({
      cycle: MUSHROOM_WEATHER_REPERCUSSION_INTERVAL,
      season: "Winter",
      windStrength: 0,
      degrees: MUSHROOM_COLD_THRESHOLD_DEGREES - 0.1,
    });

    expect(delta).toEqual({ life: -MUSHROOM_COLD_LIFE_LOSS });
  });

  it("does not lose life outside cold weather intervals", () => {
    const baseWeather = {
      season: "Spring" as const,
      windStrength: 0,
      degrees: MUSHROOM_COLD_THRESHOLD_DEGREES - 0.1,
    };

    expect(
      essence.getWeatherRepercussion({ ...baseWeather, cycle: 9 }),
    ).toEqual({ life: 0 });
    expect(
      essence.getWeatherRepercussion({
        ...baseWeather,
        cycle: MUSHROOM_WEATHER_REPERCUSSION_INTERVAL,
        degrees: MUSHROOM_COLD_THRESHOLD_DEGREES,
      }),
    ).toEqual({ life: 0 });
  });
});

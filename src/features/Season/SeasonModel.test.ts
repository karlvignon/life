import { describe, expect, it } from "vitest";
import { Autumn, Spring, Summer, Winter } from "./types";
import { SeasonModel } from "./SeasonModel";

describe("SeasonModel", () => {
  const seasons = [
    new Spring([1, 2], [10, 15]),
    new Summer([0, 1], [20, 30]),
    new Autumn([2, 4], [8, 18]),
    new Winter([3, 6], [-5, 5]),
  ];

  it("selects a season from the current cycle", () => {
    const model = new SeasonModel(seasons, 10);

    expect(model.getCurrentSeason(0)).toBe(seasons[0]);
    expect(model.getCurrentSeason(9)).toBe(seasons[0]);
    expect(model.getCurrentSeason(10)).toBe(seasons[1]);
    expect(model.getCurrentSeason(30)).toBe(seasons[3]);
  });

  it("loops back to the first season after a complete year", () => {
    const model = new SeasonModel(seasons, 10);

    expect(model.getCurrentSeason(40)).toBe(seasons[0]);
    expect(model.getCycleInCurrentSeason(40)).toBe(0);
  });

  it("exposes immutable season ranges", () => {
    const spring = new Spring([1, 3], [10, 20]);

    expect(spring.windStrenghRange).toEqual([1, 3]);
    expect(spring.degreeRange).toEqual([10, 20]);
    expect(Object.isFrozen(spring.windStrenghRange)).toBe(true);
    expect(Object.isFrozen(spring.degreeRange)).toBe(true);
  });

  it("rejects invalid configuration and cycles", () => {
    expect(() => new SeasonModel([], 10)).toThrow(RangeError);
    expect(() => new SeasonModel(seasons, 0)).toThrow(RangeError);
    expect(() => new Spring([3, 1], [10, 20])).toThrow(RangeError);

    const model = new SeasonModel(seasons, 10);
    expect(() => model.getCurrentSeason(-1)).toThrow(RangeError);
    expect(() => model.getCurrentSeason(1.5)).toThrow(RangeError);
  });
});

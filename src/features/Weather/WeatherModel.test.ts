import { describe, expect, it } from "vitest";
import { WeatherModel } from "./WeatherModel";
import type { WeatherTransition } from "./types";

describe("WeatherModel", () => {
  const transition: WeatherTransition = {
    currentCycle: 0,
    currentSeason: {
      windStrenghRange: [0, 10],
      degreeRange: [10, 20],
    },
    nextSeason: {
      windStrenghRange: [10, 30],
      degreeRange: [20, 40],
    },
    progress: 0,
  };

  it("starts at the middle of the current season ranges", () => {
    const model = new WeatherModel();

    model.updateFromSeason(transition);

    expect(model.getCurrentWindStrength()).toBe(5);
    expect(model.getCurrentDegrees()).toBe(15);
  });

  it("varies wind and degrees smoothly inside the seasonal ranges", () => {
    const model = new WeatherModel();

    model.updateFromSeason({
      ...transition,
      currentCycle: 23,
      progress: 0.5,
    });

    expect(model.getCurrentWindStrength()).toBeGreaterThanOrEqual(5);
    expect(model.getCurrentWindStrength()).toBeLessThanOrEqual(20);
    expect(model.getCurrentDegrees()).toBeGreaterThanOrEqual(15);
    expect(model.getCurrentDegrees()).toBeLessThanOrEqual(30);
    expect(model.getSnapshot()).not.toEqual({
      windStrength: 12.5,
      degrees: 22.5,
    });
  });

  it("produces deterministic weather for a given cycle", () => {
    const firstModel = new WeatherModel();
    const secondModel = new WeatherModel();
    const progressedTransition = {
      ...transition,
      currentCycle: 47,
      progress: 0.75,
    };

    firstModel.updateFromSeason(progressedTransition);
    secondModel.updateFromSeason(progressedTransition);

    expect(firstModel.getSnapshot()).toEqual(secondModel.getSnapshot());
  });

  it("keeps override values while seasons evolve", () => {
    const model = new WeatherModel();
    model.updateFromSeason(transition);
    model.setOverride({ windStrength: 42, degrees: -5 });

    model.updateFromSeason({ ...transition, currentCycle: 100, progress: 1 });

    expect(model.getSnapshot()).toEqual({
      windStrength: 42,
      degrees: -5,
    });
    expect(model.isOverrideEnabled()).toBe(true);
  });

  it("resumes at the latest seasonal values when override is cleared", () => {
    const model = new WeatherModel();
    model.updateFromSeason(transition);
    model.setOverride({ windStrength: 42, degrees: -5 });
    model.updateFromSeason({ ...transition, currentCycle: 100, progress: 1 });

    model.clearOverride();

    expect(model.getCurrentWindStrength()).toBeGreaterThanOrEqual(10);
    expect(model.getCurrentWindStrength()).toBeLessThanOrEqual(30);
    expect(model.getCurrentDegrees()).toBeGreaterThanOrEqual(20);
    expect(model.getCurrentDegrees()).toBeLessThanOrEqual(40);
    expect(model.isOverrideEnabled()).toBe(false);
  });

  it("rejects invalid ranges and transition progress", () => {
    const model = new WeatherModel();

    expect(() =>
      model.updateFromSeason({ ...transition, progress: -0.1 }),
    ).toThrow(RangeError);
    expect(() =>
      model.updateFromSeason({ ...transition, currentCycle: -1 }),
    ).toThrow(RangeError);
    expect(() =>
      model.updateFromSeason({
        ...transition,
        currentSeason: {
          ...transition.currentSeason,
          degreeRange: [20, 10],
        },
      }),
    ).toThrow(RangeError);
    expect(() =>
      model.setOverride({ windStrength: Number.NaN, degrees: 20 }),
    ).toThrow(RangeError);
  });
});

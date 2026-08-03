import { describe, expect, it } from "vitest";
import { WeatherModel } from "./WeatherModel";
import type { WeatherTransition } from "./types";

describe("WeatherModel", () => {
  const transition: WeatherTransition = {
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

  it("lerps wind and degrees toward the next season", () => {
    const model = new WeatherModel();

    model.updateFromSeason({ ...transition, progress: 0.5 });

    expect(model.getCurrentWindStrength()).toBe(12.5);
    expect(model.getCurrentDegrees()).toBe(22.5);
  });

  it("reaches the next season targets at the end of the transition", () => {
    const model = new WeatherModel();

    model.updateFromSeason({ ...transition, progress: 1 });

    expect(model.getSnapshot()).toEqual({
      windStrength: 20,
      degrees: 30,
    });
  });

  it("keeps override values while seasons evolve", () => {
    const model = new WeatherModel();
    model.updateFromSeason(transition);
    model.setOverride({ windStrength: 42, degrees: -5 });

    model.updateFromSeason({ ...transition, progress: 1 });

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
    model.updateFromSeason({ ...transition, progress: 1 });

    model.clearOverride();

    expect(model.getSnapshot()).toEqual({
      windStrength: 20,
      degrees: 30,
    });
    expect(model.isOverrideEnabled()).toBe(false);
  });

  it("rejects invalid ranges and transition progress", () => {
    const model = new WeatherModel();

    expect(() =>
      model.updateFromSeason({ ...transition, progress: -0.1 }),
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

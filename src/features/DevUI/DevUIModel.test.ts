import { describe, expect, it } from "vitest";
import { DevUIModel } from "./DevUIModel";

describe("DevUIModel", () => {
  it("rounds the measured FPS", () => {
    const model = new DevUIModel();

    model.setFps(59.6);

    expect(model.getFps()).toBe(60);
  });

  it("falls back to zero for invalid FPS values", () => {
    const model = new DevUIModel();

    model.setFps(Number.NaN);

    expect(model.getFps()).toBe(0);
  });

  it("averages render times over the configured sample window", () => {
    const model = new DevUIModel(3);

    model.addRenderTime(1);
    model.addRenderTime(2);
    model.addRenderTime(3);

    expect(model.getAverageRenderTimeMs()).toBe(2);

    model.addRenderTime(6);

    expect(model.getAverageRenderTimeMs()).toBeCloseTo(11 / 3);
  });

  it("ignores invalid render times", () => {
    const model = new DevUIModel();

    model.addRenderTime(Number.NaN);
    model.addRenderTime(-1);

    expect(model.getAverageRenderTimeMs()).toBe(0);
  });

  it("toggles card stamina costs", () => {
    const model = new DevUIModel();

    expect(model.areCardStaminaCostsDisabled()).toBe(false);
    model.setCardStaminaCostsDisabled(true);
    expect(model.areCardStaminaCostsDisabled()).toBe(true);
  });

  it("toggles the reproductibility map", () => {
    const model = new DevUIModel();

    expect(model.isReproductibilityMapEnabled()).toBe(false);
    model.setReproductibilityMapEnabled(true);
    expect(model.isReproductibilityMapEnabled()).toBe(true);
  });

  it("toggles team colors", () => {
    const model = new DevUIModel();

    expect(model.areTeamColorsEnabled()).toBe(false);
    model.setTeamColorsEnabled(true);
    expect(model.areTeamColorsEnabled()).toBe(true);
  });

  it("toggles the selected team SeedRange map", () => {
    const model = new DevUIModel();

    expect(model.isSeedRangeMapEnabled()).toBe(false);
    model.setSeedRangeMapEnabled(true);
    expect(model.isSeedRangeMapEnabled()).toBe(true);
  });

  it("syncs the game speed and exposes its normalized value", () => {
    const model = new DevUIModel();

    model.syncSpeed({ speed: 50, minSpeed: 0, maxSpeed: 200 });

    expect(model.getSpeed()).toBe(50);
    expect(model.getNormalizedSpeed()).toBe(0.25);
  });

  it("converts the speed slider position into the configured game range", () => {
    const model = new DevUIModel();
    model.syncSpeed({ speed: 10, minSpeed: 10, maxSpeed: 110 });

    model.setSpeedFromNormalized(0.75);

    expect(model.getSpeed()).toBe(85);
  });

  it("clamps speed snapshots and slider positions", () => {
    const model = new DevUIModel();
    model.syncSpeed({ speed: 300, minSpeed: 0, maxSpeed: 200 });

    expect(model.getSpeed()).toBe(200);

    model.setSpeedFromNormalized(-1);
    expect(model.getSpeed()).toBe(0);
  });

  it("tracks live weather while override is disabled", () => {
    const model = new DevUIModel();

    model.syncWeather({ windStrength: 12.5, degrees: 21 });

    expect(model.getWindStrength()).toBe(12.5);
    expect(model.getDegrees()).toBe(21);
  });

  it("keeps manual weather values while override is enabled", () => {
    const model = new DevUIModel();
    model.syncWeather({ windStrength: 12.5, degrees: 21 });
    model.setWeatherOverrideEnabled(true);
    model.setWindStrength(40);
    model.setDegrees(-10);

    model.syncWeather({ windStrength: 4, degrees: 30 });

    expect(model.getWindStrength()).toBe(40);
    expect(model.getDegrees()).toBe(-10);
  });

  it("clamps manual weather values to slider ranges", () => {
    const model = new DevUIModel();

    model.setWindStrength(100);
    model.setDegrees(-100);

    expect(model.getWindStrength()).toBe(50);
    expect(model.getDegrees()).toBe(-20);
  });
});

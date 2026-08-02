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
});

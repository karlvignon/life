import { afterEach, describe, expect, it } from "vitest";
import { gameCycle } from "../../core/GameCycle";
import { Builder } from "./model/Builder";
import { GameOfLifeEssence } from "./model/essences/GameOfLifeEssence";
import { MapModel } from "./MapModel";
import { Placeable } from "./model/Placeable";
import { BlinkerOscillator } from "./model/patterns/BlinkerOscillator";

describe("MapModel performance baselines", () => {
  const essence = new GameOfLifeEssence();
  const builder = new Builder();

  afterEach(() => {
    gameCycle.reset();
  });

  it("reports sparse living count on large grids", () => {
    const model = new MapModel(120, 67);
    builder.build(
      model,
      Placeable.centerOnGrid(new BlinkerOscillator(essence), 120, 67),
    );

    expect(model.getLivingCount()).toBe(3);
    expect(model.gridWidth * model.gridHeight).toBeGreaterThan(1000);
  });

  it("keeps blinker delta bounded across many steps", () => {
    const model = new MapModel(120, 67);
    builder.build(
      model,
      Placeable.centerOnGrid(new BlinkerOscillator(essence), 120, 67),
    );

    let maxDelta = 0;

    for (let i = 0; i < 100; i++) {
      const delta = model.step(gameCycle.advance());
      maxDelta = Math.max(maxDelta, delta.changes.length);
    }

    expect(maxDelta).toBeLessThanOrEqual(4);
  });

  it("returns empty delta when stepping an empty grid", () => {
    const model = new MapModel(120, 67);
    const delta = model.step(gameCycle.advance());

    expect(delta.changes).toEqual([]);
  });
});

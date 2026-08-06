import { afterEach, describe, expect, it } from "vitest";
import { gameCycle } from "../../core/GameCycle";
import { GameOfLifeEssence } from "./model/essences/GameOfLifeEssence";
import { MapModel } from "./MapModel";
import { Placeable } from "./model/Placeable";
import { createPattern } from "./model/patterns/PatternCatalog";
import { placeTestCells } from "./testFixtures";

describe("MapModel performance baselines", () => {
  const essence = new GameOfLifeEssence();

  function place(model: MapModel, placeable: Placeable) {
    return placeTestCells(
      model,
      placeable.getWorldCells(),
      placeable.getEssence(),
    );
  }

  afterEach(() => {
    gameCycle.reset();
  });

  function advanceStep(model: MapModel) {
    const cycle = gameCycle.advance();
    return model.step(cycle, {
      cycle,
      season: "Spring",
      windStrength: 12,
      degrees: 20,
    });
  }

  it("reports sparse living count on large grids", () => {
    const model = new MapModel(120, 67);
    place(
      model,
      Placeable.centerOnGrid(createPattern("blinker"), essence, 120, 67),
    );

    expect(model.getLivingCount()).toBe(3);
    expect(model.gridWidth * model.gridHeight).toBeGreaterThan(1000);
  });

  it("keeps blinker delta bounded across many steps", () => {
    const model = new MapModel(120, 67);
    place(
      model,
      Placeable.centerOnGrid(createPattern("blinker"), essence, 120, 67),
    );

    let maxDelta = 0;

    for (let i = 0; i < 100; i++) {
      const delta = advanceStep(model);
      maxDelta = Math.max(maxDelta, delta.changes.length);
    }

    expect(maxDelta).toBeLessThanOrEqual(4);
  });

  it("returns empty delta when stepping an empty grid", () => {
    const model = new MapModel(120, 67);
    const delta = advanceStep(model);

    expect(delta.changes).toEqual([]);
  });
});

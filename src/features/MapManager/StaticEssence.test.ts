import { afterEach, describe, expect, it } from "vitest";
import { gameCycle } from "../../core/GameCycle";
import { packIndex } from "../../core/types/grid";
import { GameOfLifeEssence } from "./model/essences/GameOfLifeEssence";
import {
  DEFAULT_STATIC_COLOR,
  StaticEssence,
} from "./model/essences/StaticEssence";
import { MapModel } from "./MapModel";
import { Placeable } from "./model/Placeable";
import { BlinkerOscillator } from "./model/patterns/BlinkerOscillator";
import { SingleCellPattern } from "./model/patterns/SingleCellPattern";

describe("StaticEssence", () => {
  const essence = new StaticEssence();
  const bounds = { width: 5, height: 5 };

  afterEach(() => {
    gameCycle.reset();
  });

  it("uses the default orange color", () => {
    expect(essence.color).toBe(DEFAULT_STATIC_COLOR);
  });

  it("keeps cells unchanged across evolution steps", () => {
    const aliveIndices = new Set([packIndex(2, 2, bounds.width)]);
    const input = {
      bounds,
      aliveIndices,
      currentCycle: 1,
      globalLivingIndices: aliveIndices,
      weather: {
        cycle: 1,
        season: "Spring" as const,
        windStrength: 12,
        degrees: 20,
      },
    };

    const first = essence.evolve(input);
    const second = essence.evolve({
      ...input,
      aliveIndices: new Set(first.aliveIndices),
    });

    expect(first.aliveIndices).toEqual([packIndex(2, 2, bounds.width)]);
    expect(second.aliveIndices).toEqual([packIndex(2, 2, bounds.width)]);
  });

  it("does not evolve a placed static cell while Conway cells change nearby", () => {
    const staticEssence = new StaticEssence();
    const conwayEssence = new GameOfLifeEssence();
    const model = new MapModel(10, 10);

    const staticPlaceable = new Placeable(
      new SingleCellPattern(staticEssence),
      1,
      1,
    );
    model.placeCells(
      staticPlaceable.getWorldCells(),
      staticPlaceable.getEssence(),
    );
    const conwayPlaceable = new Placeable(
      new BlinkerOscillator(conwayEssence),
      5,
      1,
    );
    model.placeCells(
      conwayPlaceable.getWorldCells(),
      conwayPlaceable.getEssence(),
    );

    const cycle = gameCycle.advance();
    model.step(cycle, {
      cycle,
      season: "Spring",
      windStrength: 12,
      degrees: 20,
    });

    expect(model.getTile(1, 1)?.isAlive()).toBe(true);
    expect(model.getTile(1, 1)?.getEssence()).toBe(staticEssence);
    expect(
      model.getLivingCells().filter((t) => t.getEssence() === conwayEssence),
    ).toHaveLength(3);
  });
});

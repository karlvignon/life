import { describe, expect, it } from "vitest";
import { Builder } from "./model/Builder";
import { GameOfLifeEssence } from "./model/essences/GameOfLifeEssence";
import { MapModel } from "./MapModel";
import { Placeable } from "./model/Placeable";
import {
  DEFAULT_STATIC_COLOR,
  StaticEssence,
} from "./model/essences/StaticEssence";
import { BlinkerOscillator } from "./model/patterns/BlinkerOscillator";
import { Tree } from "./model/patterns/Tree";

describe("StaticEssence", () => {
  const essence = new StaticEssence();

  it("uses the default orange color", () => {
    expect(essence.color).toBe(DEFAULT_STATIC_COLOR);
  });

  it("keeps cells unchanged across evolution steps", () => {
    const input = {
      gridWidth: 5,
      gridHeight: 5,
      aliveCells: [{ x: 2, y: 2 }],
      currentCycle: 1,
      otherEssenceCells: [],
    };

    const first = essence.evolve(input);
    const second = essence.evolve({ ...input, aliveCells: first.aliveCells });

    expect(first.aliveCells).toEqual([{ x: 2, y: 2 }]);
    expect(second.aliveCells).toEqual([{ x: 2, y: 2 }]);
  });

  it("does not evolve a placed Tree while Conway cells change nearby", () => {
    const staticEssence = new StaticEssence();
    const conwayEssence = new GameOfLifeEssence();
    const builder = new Builder();
    const model = new MapModel(10, 10);

    builder.place(model, new Placeable(new Tree(staticEssence), 1, 1));
    builder.place(
      model,
      new Placeable(new BlinkerOscillator(conwayEssence), 5, 1),
    );

    model.step();

    expect(model.getTile(1, 1)?.isAlive()).toBe(true);
    expect(model.getTile(1, 1)?.getEssence()).toBe(staticEssence);
    expect(
      model.getLivingCells().filter((t) => t.getEssence() === conwayEssence),
    ).toHaveLength(3);
  });
});

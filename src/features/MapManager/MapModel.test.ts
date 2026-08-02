import { describe, expect, it } from "vitest";
import { Builder } from "./Builder";
import {
  DEFAULT_GAME_OF_LIFE_COLOR,
  GameOfLifeEssence,
} from "./GameOfLifeEssence";
import { DEFAULT_HIGHLIFE_COLOR, HighLifeEssence } from "./HighLifeEssence";
import { MapModel } from "./MapModel";
import { Placeable } from "./Placeable";
import { BlinkerOscillator } from "./patterns/BlinkerOscillator";
import { HighLifeReplicator } from "./patterns/HighLifeReplicator";

describe("MapModel", () => {
  const essence = new GameOfLifeEssence();
  const builder = new Builder();

  it("oscillates a blinker over 2 generations", () => {
    const model = new MapModel(5, 5);
    const placeable = Placeable.centerOnGrid(
      new BlinkerOscillator(essence),
      5,
      5,
    );
    builder.build(model, placeable);

    expect(model.getLivingCells()).toHaveLength(3);

    model.step();
    const vertical = model
      .getLivingCells()
      .map((t) => ({ x: t.x, y: t.y }))
      .sort((a, b) => a.x - b.x || a.y - b.y);
    expect(vertical).toEqual([
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
    ]);

    model.step();
    const horizontal = model
      .getLivingCells()
      .map((t) => ({ x: t.x, y: t.y }))
      .sort((a, b) => a.x - b.x || a.y - b.y);
    expect(horizontal).toEqual([
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
    ]);
  });

  it("assigns the triggering essence to born cells", () => {
    const model = new MapModel(5, 5);
    const placeable = Placeable.centerOnGrid(
      new BlinkerOscillator(essence),
      5,
      5,
    );
    builder.build(model, placeable);
    model.step();

    for (const tile of model.getLivingCells()) {
      expect(tile.getEssence()).toBe(essence);
    }
  });

  it("preserves essence on resize", () => {
    const model = new MapModel(5, 5);
    const placeable = Placeable.centerOnGrid(
      new BlinkerOscillator(essence),
      5,
      5,
    );
    builder.build(model, placeable);

    model.resize(8, 8);

    for (const tile of model.getLivingCells()) {
      expect(tile.getEssence()).toBe(essence);
    }
  });

  it("evolves essence groups independently", () => {
    const essenceA = new GameOfLifeEssence();
    const essenceB = new GameOfLifeEssence();

    const model = new MapModel(10, 5);
    builder.place(model, new Placeable(new BlinkerOscillator(essenceA), 1, 1));
    builder.place(model, new Placeable(new BlinkerOscillator(essenceB), 6, 1));

    expect(model.getLivingCells()).toHaveLength(6);

    model.step();

    const groupA = model
      .getLivingCells()
      .filter((t) => t.getEssence() === essenceA);
    const groupB = model
      .getLivingCells()
      .filter((t) => t.getEssence() === essenceB);

    expect(groupA).toHaveLength(3);
    expect(groupB).toHaveLength(3);
  });

  it("keeps the original essence when a cell survives", () => {
    const essenceA = new GameOfLifeEssence();

    const model = new MapModel(5, 5);
    builder.place(model, new Placeable(new BlinkerOscillator(essenceA), 1, 1));

    model.step();

    for (const tile of model.getLivingCells()) {
      expect(tile.getEssence()).toBe(essenceA);
    }
  });

  it("resolves concurrent births with deterministic priority", () => {
    const essenceA = new GameOfLifeEssence();
    const essenceB = new GameOfLifeEssence();

    const model = new MapModel(10, 10);

    for (const { x, y } of [
      { x: 4, y: 3 },
      { x: 5, y: 3 },
      { x: 4, y: 4 },
    ]) {
      model.getTile(x, y)!.setAlive(true, essenceA);
    }

    for (const { x, y } of [
      { x: 6, y: 3 },
      { x: 6, y: 4 },
      { x: 5, y: 5 },
    ]) {
      model.getTile(x, y)!.setAlive(true, essenceB);
    }

    model.step();

    const birthTarget = model.getTile(5, 4);
    expect(birthTarget?.isAlive()).toBe(true);
    expect(birthTarget?.getEssence()).toBe(essenceA);
  });

  it("assigns HighLife essence and color to replicator cells", () => {
    const highLifeEssence = new HighLifeEssence();
    const model = new MapModel(10, 10);
    const placeable = Placeable.centerOnGrid(
      new HighLifeReplicator(highLifeEssence),
      10,
      10,
    );

    builder.build(model, placeable);

    for (const tile of model.getLivingCells()) {
      expect(tile.getEssence()).toBe(highLifeEssence);
      expect(tile.getEssence()?.color).toBe(DEFAULT_HIGHLIFE_COLOR);
    }
  });

  it("keeps Conway and HighLife colors distinct on the grid", () => {
    const conwayEssence = new GameOfLifeEssence();
    const highLifeEssence = new HighLifeEssence();

    expect(conwayEssence.color).toBe(DEFAULT_GAME_OF_LIFE_COLOR);
    expect(highLifeEssence.color).toBe(DEFAULT_HIGHLIFE_COLOR);
    expect(conwayEssence.color).not.toBe(highLifeEssence.color);
  });
});

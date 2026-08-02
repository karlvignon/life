import { describe, expect, it } from "vitest";
import { Builder } from "./model/Builder";
import {
  DEFAULT_GAME_OF_LIFE_COLOR,
  GameOfLifeEssence,
} from "./model/essences/GameOfLifeEssence";
import {
  DEFAULT_HIGHLIFE_COLOR,
  HighLifeEssence,
} from "./model/essences/HighLifeEssence";
import { StaticEssence } from "./model/essences/StaticEssence";
import { MapModel } from "./MapModel";
import { Placeable } from "./model/Placeable";
import { BlinkerOscillator } from "./model/patterns/BlinkerOscillator";
import { HighLifeReplicator } from "./model/patterns/HighLifeReplicator";
import {
  MushroomEssence,
  DEFAULT_MUSHROOM_COLOR,
} from "./model/essences/MushroomEssence";
import { SingleCellPattern } from "./model/patterns/SingleCellPattern";

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

  it("increments the current cycle on each step", () => {
    const model = new MapModel(5, 5);

    expect(model.getCurrentCycle()).toBe(0);
    model.step();
    expect(model.getCurrentCycle()).toBe(1);
    model.step();
    expect(model.getCurrentCycle()).toBe(2);
  });

  it("propagates Mushroom cells on cycle 50 with connected neighbors", () => {
    const mushroomEssence = new MushroomEssence();
    const model = new MapModel(7, 7);

    for (const { x, y } of [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 2, y: 3 },
    ]) {
      model.getTile(x, y)!.setAlive(true, mushroomEssence);
    }

    for (let i = 0; i < 49; i++) {
      model.step();
    }

    expect(model.getTile(3, 3)?.isAlive()).toBe(false);

    model.step();

    expect(model.getCurrentCycle()).toBe(50);
    expect(model.getTile(3, 3)?.isAlive()).toBe(true);
    expect(model.getTile(3, 3)?.getEssence()).toBe(mushroomEssence);
  });

  it("kills Mushroom cells when surrounded by a connected enemy group", () => {
    const mushroomEssence = new MushroomEssence();
    const enemyEssence = new StaticEssence();
    const model = new MapModel(7, 7);

    model.getTile(3, 3)!.setAlive(true, mushroomEssence);
    for (const { x, y } of [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 2, y: 3 },
    ]) {
      model.getTile(x, y)!.setAlive(true, enemyEssence);
    }

    for (let i = 0; i < 50; i++) {
      model.step();
    }

    expect(model.getTile(3, 3)?.isAlive()).toBe(false);
  });

  it("assigns Mushroom essence and color to placed single cells", () => {
    const mushroomEssence = new MushroomEssence();
    const model = new MapModel(5, 5);
    const placeable = Placeable.centerOnGrid(
      new SingleCellPattern(mushroomEssence),
      5,
      5,
    );

    builder.build(model, placeable);

    for (const tile of model.getLivingCells()) {
      expect(tile.getEssence()).toBe(mushroomEssence);
      expect(tile.getEssence()?.color).toBe(DEFAULT_MUSHROOM_COLOR);
    }
  });
});

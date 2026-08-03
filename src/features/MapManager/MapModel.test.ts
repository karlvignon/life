import { afterEach, describe, expect, it } from "vitest";
import { gameCycle } from "../../core/GameCycle";
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

function weatherForCycle(cycle: number) {
  return Object.freeze({
    cycle,
    windStrength: 12,
    degrees: 25,
  });
}

function advanceStep(model: MapModel) {
  const cycle = gameCycle.advance();
  return model.step(cycle, weatherForCycle(cycle));
}

describe("MapModel", () => {
  const essence = new GameOfLifeEssence();

  function place(model: MapModel, placeable: Placeable) {
    return model.placeCells(placeable.getWorldCells(), placeable.getEssence());
  }

  afterEach(() => {
    gameCycle.reset();
  });

  it("oscillates a blinker over 2 generations", () => {
    const model = new MapModel(5, 5);
    const placeable = Placeable.centerOnGrid(
      new BlinkerOscillator(essence),
      5,
      5,
    );
    place(model, placeable);

    expect(model.getLivingCells()).toHaveLength(3);

    advanceStep(model);
    const vertical = model
      .getLivingCells()
      .map((t) => ({ x: t.x, y: t.y }))
      .sort((a, b) => a.x - b.x || a.y - b.y);
    expect(vertical).toEqual([
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
    ]);

    advanceStep(model);
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

  it("returns a small delta for blinker steps", () => {
    const model = new MapModel(5, 5);
    place(model, Placeable.centerOnGrid(new BlinkerOscillator(essence), 5, 5));

    const delta = advanceStep(model);

    expect(delta.changes.length).toBeLessThanOrEqual(4);
    expect(delta.changes.length).toBeGreaterThan(0);
  });

  it("assigns the triggering essence to born cells", () => {
    const model = new MapModel(5, 5);
    const placeable = Placeable.centerOnGrid(
      new BlinkerOscillator(essence),
      5,
      5,
    );
    place(model, placeable);
    advanceStep(model);

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
    place(model, placeable);

    model.resize(8, 8);

    for (const tile of model.getLivingCells()) {
      expect(tile.getEssence()).toBe(essence);
    }
  });

  it("evolves essence groups independently", () => {
    const essenceA = new GameOfLifeEssence();
    const essenceB = new GameOfLifeEssence();

    const model = new MapModel(10, 5);
    place(model, new Placeable(new BlinkerOscillator(essenceA), 1, 1));
    place(model, new Placeable(new BlinkerOscillator(essenceB), 6, 1));

    expect(model.getLivingCells()).toHaveLength(6);

    advanceStep(model);

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
    place(model, new Placeable(new BlinkerOscillator(essenceA), 1, 1));

    advanceStep(model);

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
      model.setCellAlive(x, y, essenceA);
    }

    for (const { x, y } of [
      { x: 6, y: 3 },
      { x: 6, y: 4 },
      { x: 5, y: 5 },
    ]) {
      model.setCellAlive(x, y, essenceB);
    }

    advanceStep(model);

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

    place(model, placeable);

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

  it("advances the global cycle counter when stepping", () => {
    const model = new MapModel(5, 5);

    expect(gameCycle.getCurrentCycle()).toBe(0);
    let cycle = gameCycle.advance();
    model.step(cycle, weatherForCycle(cycle));
    expect(gameCycle.getCurrentCycle()).toBe(1);
    cycle = gameCycle.advance();
    model.step(cycle, weatherForCycle(cycle));
    expect(gameCycle.getCurrentCycle()).toBe(2);
  });

  it("propagates Mushroom cells on propagation cycles with connected neighbors", () => {
    const mushroomEssence = new MushroomEssence();
    const model = new MapModel(7, 7);

    for (const { x, y } of [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 2, y: 3 },
    ]) {
      model.setCellAlive(x, y, mushroomEssence);
    }

    for (let i = 0; i < 9; i++) {
      advanceStep(model);
    }

    expect(model.getTile(3, 3)?.isAlive()).toBe(false);

    advanceStep(model);

    expect(gameCycle.getCurrentCycle()).toBe(10);
    expect(model.getTile(3, 3)?.isAlive()).toBe(true);
    expect(model.getTile(3, 3)?.getEssence()).toBe(mushroomEssence);
  });

  it("kills Mushroom cells when surrounded by a connected enemy group", () => {
    const mushroomEssence = new MushroomEssence();
    const enemyEssence = new StaticEssence();
    const model = new MapModel(7, 7);

    model.setCellAlive(3, 3, mushroomEssence);
    for (const { x, y } of [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 2, y: 3 },
    ]) {
      model.setCellAlive(x, y, enemyEssence);
    }

    for (let i = 0; i < 50; i++) {
      advanceStep(model);
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

    place(model, placeable);

    for (const tile of model.getLivingCells()) {
      expect(tile.getEssence()).toBe(mushroomEssence);
      expect(tile.getEssence()?.color).toBe(DEFAULT_MUSHROOM_COLOR);
    }
  });

  it("tracks living count without scanning the full grid", () => {
    const model = new MapModel(100, 100);
    model.setCellAlive(50, 50, essence);

    expect(model.getLivingCount()).toBe(1);
    expect(model.getLivingCells()).toHaveLength(1);
  });

  it("rejects invalid cycle values", () => {
    const model = new MapModel(5, 5);
    expect(() => model.step(0, weatherForCycle(0))).toThrow(RangeError);
    expect(() => model.step(-1, weatherForCycle(-1))).toThrow(RangeError);
  });

  it("rejects weather from a different cycle", () => {
    const model = new MapModel(5, 5);

    expect(() => model.step(2, weatherForCycle(1))).toThrow(RangeError);
  });
});

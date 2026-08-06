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
import {
  MushroomEssence,
  DEFAULT_MUSHROOM_COLOR,
  MUSHROOM_BIRTH_PATTERN,
} from "./model/essences/MushroomEssence";
import { MushroomSproutEssence } from "./model/essences/MushroomSproutEssence";
import { createPattern } from "./model/patterns/PatternCatalog";
import { createLifeLikeBehavior } from "./model/evolution/behaviors/LifeLikeBehavior";
import { Essence } from "./model/essences/Essence";
import {
  OTHER_TEST_PLAYER_ID,
  OTHER_TEST_PROVENANCE,
  placeTestCells,
  setTestCellAlive,
  TEST_PLAYER_ID,
} from "./testFixtures";

function weatherForCycle(cycle: number) {
  return Object.freeze({
    cycle,
    season: "Spring" as const,
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
    return placeTestCells(
      model,
      placeable.getWorldCells(),
      placeable.getEssence(),
    );
  }

  afterEach(() => {
    gameCycle.reset();
  });

  it("records the owner of a player placement", () => {
    const model = new MapModel(3, 3);

    setTestCellAlive(model, 1, 1, essence);

    expect(model.getTile(1, 1)?.getProvenance()).toEqual({
      kind: "player-placement",
      playerId: TEST_PLAYER_ID,
    });
  });

  it("transfers ownership when another player places the same essence", () => {
    const model = new MapModel(3, 3);
    placeTestCells(model, [{ x: 1, y: 1 }], essence);

    const changes = placeTestCells(
      model,
      [{ x: 1, y: 1 }],
      essence,
      OTHER_TEST_PROVENANCE,
    );

    expect(changes.changes).toEqual([{ x: 1, y: 1, alive: true, essence }]);
    expect(model.getTile(1, 1)?.getProvenance()?.playerId).toBe(
      OTHER_TEST_PLAYER_ID,
    );
  });

  it("refuses to replace living cells with another essence", () => {
    const model = new MapModel(3, 3);
    const mushroom = new MushroomEssence();
    const sprout = new MushroomSproutEssence();
    placeTestCells(
      model,
      [
        { x: 1, y: 1 },
        { x: 1, y: 2 },
      ],
      mushroom,
    );

    const changes = placeTestCells(
      model,
      [
        { x: 1, y: 1 },
        { x: 1, y: 2 },
      ],
      sprout,
      OTHER_TEST_PROVENANCE,
    );

    expect(changes.changes).toEqual([]);
    expect(model.getTile(1, 1)?.getEssence()).toBe(mushroom);
    expect(model.getTile(1, 2)?.getEssence()).toBe(mushroom);
    expect(model.getTile(1, 1)?.getProvenance()?.playerId).toBe(TEST_PLAYER_ID);
  });

  it("rejects a whole pattern when only one cell conflicts", () => {
    const model = new MapModel(3, 3);
    const mushroom = new MushroomEssence();
    const sprout = new MushroomSproutEssence();
    setTestCellAlive(model, 1, 1, mushroom);

    const changes = placeTestCells(
      model,
      [
        { x: 1, y: 1 },
        { x: 1, y: 2 },
      ],
      sprout,
    );

    expect(changes.changes).toEqual([]);
    expect(model.getTile(1, 1)?.getEssence()).toBe(mushroom);
    expect(model.getTile(1, 2)?.isAlive()).toBe(false);
  });

  it("gives newborn cells the common owner of their parents", () => {
    const model = new MapModel(5, 5);
    place(
      model,
      Placeable.centerOnGrid(createPattern("blinker"), essence, 5, 5),
    );

    advanceStep(model);

    expect(model.getTile(2, 1)?.getProvenance()).toEqual({
      kind: "simulation-birth",
      playerId: TEST_PLAYER_ID,
    });
    expect(model.getTile(2, 3)?.getProvenance()).toEqual({
      kind: "simulation-birth",
      playerId: TEST_PLAYER_ID,
    });
  });

  it("uses player colors only when a render color resolver is provided", () => {
    const model = new MapModel(3, 3);
    placeTestCells(model, [{ x: 1, y: 1 }], essence);

    const regularSnapshot = model.createRenderSnapshot(16);
    const teamSnapshot = model.createRenderSnapshot(16, (playerId) =>
      playerId === TEST_PLAYER_ID ? 0x3b82f6 : 0xef4444,
    );

    expect(regularSnapshot.livingCells[0].fillColor).toBe(essence.color);
    expect(teamSnapshot.livingCells[0].fillColor).toBe(0x3b82f6);
  });

  it("oscillates a blinker over 2 generations", () => {
    const model = new MapModel(5, 5);
    const placeable = Placeable.centerOnGrid(
      createPattern("blinker"),
      essence,
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
    place(
      model,
      Placeable.centerOnGrid(createPattern("blinker"), essence, 5, 5),
    );

    const delta = advanceStep(model);

    expect(delta.changes.length).toBeLessThanOrEqual(4);
    expect(delta.changes.length).toBeGreaterThan(0);
  });

  it("assigns the triggering essence to born cells", () => {
    const model = new MapModel(5, 5);
    const placeable = Placeable.centerOnGrid(
      createPattern("blinker"),
      essence,
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
      createPattern("blinker"),
      essence,
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
    const conway = createLifeLikeBehavior("conway", {
      birthNeighborCounts: new Set([3]),
      survivalNeighborCounts: new Set([2, 3]),
    });
    const essenceA = new Essence({
      id: "independent-a",
      name: "Independent A",
      color: 0x111111,
      evolutionBehaviors: [conway],
    });
    const essenceB = new Essence({
      id: "independent-b",
      name: "Independent B",
      color: 0x222222,
      evolutionBehaviors: [conway],
    });

    const model = new MapModel(10, 5);
    place(model, new Placeable(createPattern("blinker"), essenceA, 1, 1));
    place(model, new Placeable(createPattern("blinker"), essenceB, 6, 1));

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
    place(model, new Placeable(createPattern("blinker"), essenceA, 1, 1));

    advanceStep(model);

    for (const tile of model.getLivingCells()) {
      expect(tile.getEssence()).toBe(essenceA);
    }
  });

  it("counts allied cells from the same evolution family together", () => {
    const essenceA = new GameOfLifeEssence();
    const essenceB = new GameOfLifeEssence();

    const model = new MapModel(10, 10);

    for (const { x, y } of [
      { x: 4, y: 3 },
      { x: 5, y: 3 },
      { x: 4, y: 4 },
    ]) {
      setTestCellAlive(model, x, y, essenceA);
    }

    for (const { x, y } of [
      { x: 6, y: 3 },
      { x: 6, y: 4 },
      { x: 5, y: 5 },
    ]) {
      setTestCellAlive(model, x, y, essenceB);
    }

    advanceStep(model);

    const birthTarget = model.getTile(5, 4);
    // Les six voisines alliées sont évaluées ensemble : Conway ne fait pas
    // naître une cellule avec six voisines.
    expect(birthTarget?.isAlive()).toBe(false);
  });

  it("assigns HighLife essence and color to replicator cells", () => {
    const highLifeEssence = new HighLifeEssence();
    const model = new MapModel(10, 10);
    const placeable = Placeable.centerOnGrid(
      createPattern("replicator"),
      highLifeEssence,
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

  it("births a Mushroom cell only from its complete pattern", () => {
    const mushroomEssence = new MushroomEssence();
    const model = new MapModel(9, 9);
    const center = { x: 4, y: 4 };

    for (const offset of MUSHROOM_BIRTH_PATTERN) {
      setTestCellAlive(
        model,
        center.x + offset.x,
        center.y + offset.y,
        mushroomEssence,
      );
    }

    expect(model.getTile(center.x, center.y)?.isAlive()).toBe(false);

    advanceStep(model);

    expect(model.getTile(center.x, center.y)?.isAlive()).toBe(true);
    expect(model.getTile(center.x, center.y)?.getEssence()).toBe(
      mushroomEssence,
    );
    expect(
      model.getTile(center.x, center.y)?.getData()?.getReproducibility(),
    ).toBe(9);
    for (const offset of MUSHROOM_BIRTH_PATTERN) {
      expect(
        model
          .getTile(center.x + offset.x, center.y + offset.y)
          ?.getData()
          ?.getReproducibility(),
      ).toBe(9);
    }
    expect(model.createReproductibilityMapSnapshot().livingCells).toEqual(
      expect.arrayContaining([
        { x: center.x, y: center.y, score: 9 },
        ...MUSHROOM_BIRTH_PATTERN.map((offset) => ({
          x: center.x + offset.x,
          y: center.y + offset.y,
          score: 9,
        })),
      ]),
    );
  });

  it("applies weather repercussions independently to every cell", () => {
    class WeatherSensitiveEssence extends StaticEssence {
      getWeatherRepercussion(): { life: number } {
        return { life: -10 };
      }
    }

    const weatherSensitiveEssence = new WeatherSensitiveEssence();
    const model = new MapModel(5, 5);
    setTestCellAlive(model, 1, 1, weatherSensitiveEssence);
    setTestCellAlive(model, 2, 2, weatherSensitiveEssence);
    model.getTile(1, 1)?.apply({ life: -30 });

    model.step(1, weatherForCycle(1));

    expect(model.getTile(1, 1)?.getData()?.getLife()).toBe(60);
    expect(model.getTile(2, 2)?.getData()?.getLife()).toBe(90);
  });

  it("kills only the cell whose individual life reaches zero", () => {
    class WeatherSensitiveEssence extends StaticEssence {
      getWeatherRepercussion(): { life: number } {
        return { life: -10 };
      }
    }

    const sharedEssence = new WeatherSensitiveEssence();
    const model = new MapModel(5, 5);
    setTestCellAlive(model, 1, 1, sharedEssence);
    setTestCellAlive(model, 2, 2, sharedEssence);
    model.getTile(1, 1)?.apply({ life: -90 });

    model.step(1, weatherForCycle(1));

    expect(model.getTile(1, 1)?.isAlive()).toBe(false);
    expect(model.getTile(2, 2)?.isAlive()).toBe(true);
    expect(model.getTile(2, 2)?.getData()?.getLife()).toBe(90);
    expect(model.getLivingCount()).toBe(1);
  });

  it.each([-100, -101])(
    "kills affected cells when their life reaches zero or less (%i)",
    (lifeDelta) => {
      class DyingEssence extends StaticEssence {
        getWeatherRepercussion(): { life: number } {
          return { life: lifeDelta };
        }
      }

      const dyingEssence = new DyingEssence();
      const model = new MapModel(5, 5);
      setTestCellAlive(model, 1, 1, dyingEssence);
      setTestCellAlive(model, 2, 2, dyingEssence);

      const changes = model.step(1, weatherForCycle(1));

      expect(model.getLivingCount()).toBe(0);
      expect(model.getTile(1, 1)?.isAlive()).toBe(false);
      expect(model.getTile(2, 2)?.isAlive()).toBe(false);
      expect(changes.changes).toEqual(
        expect.arrayContaining([
          { x: 1, y: 1, alive: false, essence: null },
          { x: 2, y: 2, alive: false, essence: null },
        ]),
      );
    },
  );

  it("loses 10 Mushroom life every 10 cold cycles", () => {
    const mushroomEssence = new MushroomEssence();
    const model = new MapModel(5, 5);
    setTestCellAlive(model, 2, 2, mushroomEssence);

    for (let cycle = 1; cycle <= 10; cycle++) {
      model.step(cycle, {
        ...weatherForCycle(cycle),
        degrees: 24.9,
      });
    }

    expect(model.getTile(2, 2)?.getData()?.getLife()).toBe(90);
    expect(model.getTile(2, 2)?.isAlive()).toBe(true);
  });

  it("keeps Mushroom cells alive near enemy groups", () => {
    const mushroomEssence = new MushroomEssence();
    const enemyEssence = new StaticEssence();
    const model = new MapModel(7, 7);

    setTestCellAlive(model, 3, 3, mushroomEssence);
    for (const { x, y } of [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 2, y: 3 },
    ]) {
      setTestCellAlive(model, x, y, enemyEssence);
    }

    for (let i = 0; i < 50; i++) {
      advanceStep(model);
    }

    expect(model.getTile(3, 3)?.isAlive()).toBe(true);
  });

  it("assigns Mushroom essence and color to placed single cells", () => {
    const mushroomEssence = new MushroomEssence();
    const model = new MapModel(5, 5);
    const placeable = Placeable.centerOnGrid(
      createPattern("cell"),
      mushroomEssence,
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
    setTestCellAlive(model, 50, 50, essence);

    expect(model.getLivingCount()).toBe(1);
    expect(model.getLivingCells()).toHaveLength(1);
  });

  it("stores independent life for cells sharing the same essence", () => {
    const sharedEssence = new StaticEssence();
    const model = new MapModel(5, 5);
    placeTestCells(
      model,
      [
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ],
      sharedEssence,
    );

    model.getTile(1, 1)?.apply({ life: -40 });

    expect(model.getTile(1, 1)?.getData()?.getLife()).toBe(60);
    expect(model.getTile(2, 2)?.getData()?.getLife()).toBe(100);
    expect(model.getTile(1, 1)?.getEssence()).toBe(sharedEssence);
    expect(model.getTile(2, 2)?.getEssence()).toBe(sharedEssence);
  });

  it("preserves each cell life when resizing the grid", () => {
    const model = new MapModel(5, 5);
    setTestCellAlive(model, 1, 1, new StaticEssence());
    model.getTile(1, 1)?.apply({ life: -40 });

    model.resize(8, 8);

    expect(model.getTile(1, 1)?.getData()?.getLife()).toBe(60);
    expect(model.getTile(1, 1)?.getData()?.getMaximumLife()).toBe(100);
    expect(model.getTile(1, 1)?.getProvenance()?.playerId).toBe(TEST_PLAYER_ID);
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

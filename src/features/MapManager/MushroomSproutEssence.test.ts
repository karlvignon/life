import { describe, expect, it } from "vitest";
import { MapModel } from "./MapModel";
import { Placeable } from "./model/Placeable";
import {
  MUSHROOM_BIRTH_PATTERN,
  MushroomEssence,
} from "./model/essences/MushroomEssence";
import {
  MUSHROOM_SPROUT_BIRTH_PATTERN,
  MushroomSproutEssence,
} from "./model/essences/MushroomSproutEssence";
import { createPattern } from "./model/patterns/PatternCatalog";
import { placeTestCells, setTestCellAlive } from "./testFixtures";

const WEATHER = Object.freeze({
  cycle: 1,
  season: "Spring" as const,
  windStrength: 0,
  degrees: 25,
});

describe("MushroomSproutEssence", () => {
  it("keeps the parent pattern, adds the vertical pattern and score 7", () => {
    const essence = new MushroomSproutEssence();

    expect(essence.getBirthPattern()).toEqual(MUSHROOM_BIRTH_PATTERN);
    expect(essence.getSproutBirthPattern()).toEqual([
      { x: 0, y: 1 },
      { x: 0, y: 2 },
    ]);
    expect(MUSHROOM_SPROUT_BIRTH_PATTERN).toEqual(
      essence.getSproutBirthPattern(),
    );
    expect(essence.getInitialProperties().reproducibility).toBe(7);
  });

  it("births above two vertical mushrooms and charges both parents", () => {
    const essence = new MushroomSproutEssence();
    const model = new MapModel(5, 6);
    const placeable = new Placeable(
      createPattern("mushroom-sprout"),
      essence,
      1,
      1,
    );

    placeTestCells(model, placeable.getWorldCells(), essence);
    model.step(1, WEATHER);

    expect(model.getTile(2, 1)?.getEssence()).toBe(essence);
    expect(model.getTile(2, 1)?.getData()?.getReproducibility()).toBe(6);
    expect(model.getTile(2, 2)?.getData()?.getReproducibility()).toBe(6);
    expect(model.getTile(2, 3)?.getData()?.getReproducibility()).toBe(6);
  });

  it("rotates the birth pattern with its placed tiles", () => {
    const essence = new MushroomSproutEssence();
    const model = new MapModel(6, 5);
    const placeable = new Placeable(
      createPattern("mushroom-sprout"),
      essence,
      1,
      1,
    ).withRotation(90);

    placeTestCells(
      model,
      placeable.getWorldCells(),
      essence,
      undefined,
      placeable.getRotation(),
    );
    model.step(1, WEATHER);

    expect(model.getTile(2, 2)?.getRotation()).toBe(90);
    expect(model.getTile(1, 2)?.getRotation()).toBe(90);
    expect(model.getTile(3, 2)?.getEssence()).toBe(essence);
    expect(model.getTile(3, 2)?.getRotation()).toBe(90);
    expect(model.getTile(2, 1)?.isAlive()).toBe(false);
  });

  it("applies parent and sprout evolutions during the same tick", () => {
    const essence = new MushroomSproutEssence();
    const model = new MapModel(8, 6);
    const parentBirth = { x: 2, y: 2 };
    const sproutBirth = { x: 6, y: 1 };

    for (const offset of MUSHROOM_BIRTH_PATTERN) {
      setTestCellAlive(
        model,
        parentBirth.x + offset.x,
        parentBirth.y + offset.y,
        essence,
      );
    }
    setTestCellAlive(model, sproutBirth.x, sproutBirth.y + 1, essence);
    setTestCellAlive(model, sproutBirth.x, sproutBirth.y + 2, essence);

    model.step(1, WEATHER);

    expect(model.getTile(parentBirth.x, parentBirth.y)?.getEssence()).toBe(
      essence,
    );
    expect(model.getTile(sproutBirth.x, sproutBirth.y)?.getEssence()).toBe(
      essence,
    );
  });

  it("does not grow a sprout from two ordinary vertical mushrooms", () => {
    const model = new MapModel(7, 7);
    const mushroom = new MushroomEssence();
    const sprout = new MushroomSproutEssence();
    const birthTarget = { x: 2, y: 1 };

    setTestCellAlive(model, birthTarget.x, birthTarget.y + 1, mushroom);
    setTestCellAlive(model, birthTarget.x, birthTarget.y + 2, mushroom);
    // La présence d'un sprout dans la même famille déclenche l'évaluation de
    // ses comportements, mais ne doit pas servir de parent à distance.
    setTestCellAlive(model, 5, 5, sprout);

    model.step(1, WEATHER);

    expect(model.getTile(birthTarget.x, birthTarget.y)?.isAlive()).toBe(false);
  });

  it("stops the vertical propagation when its inherited score is exhausted", () => {
    const essence = new MushroomSproutEssence();
    const model = new MapModel(5, 16);
    const placeable = new Placeable(
      createPattern("mushroom-sprout"),
      essence,
      1,
      10,
    );
    placeTestCells(model, placeable.getWorldCells(), essence);

    for (let cycle = 1; cycle <= 8; cycle++) {
      model.step(cycle, { ...WEATHER, cycle });
    }

    expect(model.getTile(2, 4)?.getData()?.getReproducibility()).toBe(0);
    expect(model.getTile(2, 3)?.isAlive()).toBe(false);
  });

  it("prioritizes the allied Mushroom cross over the Sprout column", () => {
    const teamResolver = {
      getPlayerTeam: () => ({ id: "blue", label: "Blue", color: 0x0000ff }),
    };
    const model = new MapModel(5, 6, { teamResolver });
    const mushroom = new MushroomEssence();
    const sprout = new MushroomSproutEssence();
    const mushroomOwner = {
      kind: "player-placement" as const,
      playerId: "player-1",
    };
    const sproutOwner = {
      kind: "player-placement" as const,
      playerId: "player-2",
    };

    for (const { x, y } of [
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 3, y: 2 },
    ]) {
      model.setCellAlive(x, y, mushroom, mushroomOwner);
    }
    model.setCellAlive(2, 3, sprout, sproutOwner);
    model.setCellAlive(2, 4, sprout, sproutOwner);

    model.step(1, WEATHER);

    const newborn = model.getTile(2, 2);
    expect(newborn?.getEssence()).toBe(mushroom);
    expect(newborn?.getProvenance()?.playerId).toBe("player-1");
    expect(newborn?.getData()?.getReproducibility()).toBe(6);
    expect(model.getTile(2, 4)?.getData()?.getReproducibility()).toBe(7);
  });
});

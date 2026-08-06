import { describe, expect, it } from "vitest";
import { MapModel } from "./MapModel";
import { Placeable } from "./model/Placeable";
import { MUSHROOM_BIRTH_PATTERN } from "./model/essences/MushroomEssence";
import {
  MUSHROOM_SPROUT_BIRTH_PATTERN,
  MushroomSproutEssence,
} from "./model/essences/MushroomSproutEssence";
import { createPattern } from "./model/patterns/PatternCatalog";

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

    model.placeCells(placeable.getWorldCells(), essence);
    model.step(1, WEATHER);

    expect(model.getTile(2, 1)?.getEssence()).toBe(essence);
    expect(model.getTile(2, 1)?.getData()?.getReproducibility()).toBe(6);
    expect(model.getTile(2, 2)?.getData()?.getReproducibility()).toBe(6);
    expect(model.getTile(2, 3)?.getData()?.getReproducibility()).toBe(6);
  });

  it("applies parent and sprout evolutions during the same tick", () => {
    const essence = new MushroomSproutEssence();
    const model = new MapModel(8, 6);
    const parentBirth = { x: 2, y: 2 };
    const sproutBirth = { x: 6, y: 1 };

    for (const offset of MUSHROOM_BIRTH_PATTERN) {
      model.setCellAlive(
        parentBirth.x + offset.x,
        parentBirth.y + offset.y,
        essence,
      );
    }
    model.setCellAlive(sproutBirth.x, sproutBirth.y + 1, essence);
    model.setCellAlive(sproutBirth.x, sproutBirth.y + 2, essence);

    model.step(1, WEATHER);

    expect(model.getTile(parentBirth.x, parentBirth.y)?.getEssence()).toBe(
      essence,
    );
    expect(model.getTile(sproutBirth.x, sproutBirth.y)?.getEssence()).toBe(
      essence,
    );
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
    model.placeCells(placeable.getWorldCells(), essence);

    for (let cycle = 1; cycle <= 8; cycle++) {
      model.step(cycle, { ...WEATHER, cycle });
    }

    expect(model.getTile(2, 4)?.getData()?.getReproducibility()).toBe(0);
    expect(model.getTile(2, 3)?.isAlive()).toBe(false);
  });
});

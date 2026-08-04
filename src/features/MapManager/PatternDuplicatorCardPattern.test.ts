import { describe, expect, it } from "vitest";
import {
  FLORA_BIRTH_PATTERN,
  FloraEssence,
} from "./model/essences/FloraEssence";
import { MapModel } from "./MapModel";
import { PatternDuplicatorCardPattern } from "./model/patterns/PatternDuplicatorCardPattern";
import { Placeable } from "./model/Placeable";

describe("PatternDuplicatorCardPattern", () => {
  it("rejects an empty birth pattern", () => {
    expect(() => new PatternDuplicatorCardPattern("flora-birth", [])).toThrow(
      RangeError,
    );
  });

  it("normalizes relative birth offsets to a top-left placeable pattern", () => {
    const pattern = new PatternDuplicatorCardPattern(
      "flora-birth",
      FLORA_BIRTH_PATTERN,
    );

    expect(pattern.getCells()).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ]);
    expect(pattern.getBounds()).toEqual({ width: 3, height: 3 });
  });

  it("places the creation pattern with an empty center that births next cycle", () => {
    const model = new MapModel(7, 7);
    const essence = new FloraEssence();
    const pattern = new PatternDuplicatorCardPattern(
      "flora-birth",
      essence.getBirthPattern(),
    );
    const placeable = new Placeable(pattern, essence, 2, 2);

    model.placeCells(placeable.getWorldCells(), essence);
    expect(model.getTile(3, 3)?.isAlive()).toBe(false);

    model.step(1, {
      cycle: 1,
      season: "Spring",
      windStrength: 0,
      degrees: 20,
    });

    expect(model.getTile(3, 3)?.getEssence()).toBe(essence);
  });
});

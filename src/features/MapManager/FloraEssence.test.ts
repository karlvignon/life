import { describe, expect, it } from "vitest";
import { MapModel } from "./MapModel";
import {
  DEFAULT_FLORA_COLOR,
  FLORA_BIRTH_PATTERN,
  FloraEssence,
} from "./model/essences/FloraEssence";

describe("FloraEssence", () => {
  it("uses an eight-flower ring pattern", () => {
    const essence = new FloraEssence();

    expect(essence.color).toBe(DEFAULT_FLORA_COLOR);
    expect(essence.getBirthPattern()).toEqual([
      { x: -1, y: -1 },
      { x: 0, y: -1 },
      { x: 1, y: -1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]);
  });

  it("births Flora at the center of its complete ring", () => {
    const essence = new FloraEssence();
    const model = new MapModel(7, 7);
    const center = { x: 3, y: 3 };

    for (const offset of FLORA_BIRTH_PATTERN) {
      model.setCellAlive(center.x + offset.x, center.y + offset.y, essence);
    }

    model.step(1, {
      cycle: 1,
      season: "Spring",
      windStrength: 0,
      degrees: 20,
    });

    expect(model.getTile(center.x, center.y)?.getEssence()).toBe(essence);
  });
});

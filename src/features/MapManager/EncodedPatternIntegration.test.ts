import { describe, expect, it } from "vitest";
import { MapModel } from "./MapModel";
import { Placeable } from "./model/Placeable";
import { FloraEssence } from "./model/essences/FloraEssence";
import { createPattern } from "./model/patterns/PatternCatalog";

describe("encoded pattern integration", () => {
  it("places the flora ring whose empty center births next cycle", () => {
    const model = new MapModel(7, 7);
    const essence = new FloraEssence();
    const pattern = createPattern("flora-birth");
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

import { describe, expect, it } from "vitest";
import { Placeable } from "./model/Placeable";
import { GameOfLifeEssence } from "./model/essences/GameOfLifeEssence";
import { StaticEssence } from "./model/essences/StaticEssence";
import { createPattern } from "./model/patterns/PatternCatalog";

describe("Placeable", () => {
  it("associates the same pure pattern with different essences", () => {
    const pattern = createPattern("cell");
    const conway = new GameOfLifeEssence();
    const staticEssence = new StaticEssence();

    const conwayPlaceable = new Placeable(pattern, conway, 1, 2);
    const staticPlaceable = new Placeable(pattern, staticEssence, 3, 4);

    expect(conwayPlaceable.getPattern()).toBe(pattern);
    expect(staticPlaceable.getPattern()).toBe(pattern);
    expect(conwayPlaceable.getEssence()).toBe(conway);
    expect(staticPlaceable.getEssence()).toBe(staticEssence);
  });

  it("preserves pattern and essence when moving the origin", () => {
    const pattern = createPattern("cell");
    const essence = new StaticEssence();
    const moved = new Placeable(pattern, essence, 0, 0).withOrigin(5, 7);

    expect(moved.getPattern()).toBe(pattern);
    expect(moved.getEssence()).toBe(essence);
    expect(moved.getOrigin()).toEqual({ x: 5, y: 7 });
  });
});

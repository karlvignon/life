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

  it("rotates cells clockwise while keeping a top-left origin", () => {
    const pattern = createPattern("glider");
    const essence = new StaticEssence();
    const placeable = new Placeable(pattern, essence, 10, 20);

    expect(placeable.withRotation(90).getWorldCells()).toEqual(
      pattern.getCells().map(({ x, y }) => ({
        x: 10 + pattern.getBounds().height - 1 - y,
        y: 20 + x,
      })),
    );
    expect(placeable.withRotation(180).getWorldCells()).toEqual(
      pattern.getCells().map(({ x, y }) => ({
        x: 10 + pattern.getBounds().width - 1 - x,
        y: 20 + pattern.getBounds().height - 1 - y,
      })),
    );
    expect(placeable.withRotation(270).getWorldCells()).toEqual(
      pattern.getCells().map(({ x, y }) => ({
        x: 10 + y,
        y: 20 + pattern.getBounds().width - 1 - x,
      })),
    );
  });

  it("preserves rotation when moving the origin", () => {
    const pattern = createPattern("glider");
    const essence = new StaticEssence();
    const moved = new Placeable(pattern, essence, 0, 0)
      .withRotation(90)
      .withOrigin(5, 7);

    expect(moved.getRotation()).toBe(90);
    expect(moved.getOrigin()).toEqual({ x: 5, y: 7 });
  });
});

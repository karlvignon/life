import { describe, expect, it } from "vitest";
import { MapModel } from "../MapManager/MapModel";
import { TEST_PROVENANCE } from "../MapManager/testFixtures";
import { getCard } from "./Cards";

describe("VitalityMushroom card", () => {
  it("adds five reproducibility points to every living neighbor on birth", () => {
    const model = new MapModel(5, 5);
    const card = getCard("mushroom:vitality-mushroom");
    if (!card) {
      throw new Error("VitalityMushroom card is missing");
    }

    const neighbors = [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 1, y: 2 },
      { x: 3, y: 2 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
    ];
    for (const { x, y } of neighbors) {
      model.setCellAlive(x, y, card.essence, TEST_PROVENANCE);
    }

    model.placeCells(
      [{ x: 2, y: 2 }],
      card.essence,
      TEST_PROVENANCE,
      card.behaviors,
    );

    for (const { x, y } of neighbors) {
      expect(model.getTile(x, y)?.getData()?.getReproducibility()).toBe(15);
    }
    expect(model.getTile(2, 2)?.getData()?.getReproducibility()).toBe(10);
  });

  it("ignores empty neighboring tiles", () => {
    const model = new MapModel(3, 3);
    const card = getCard("mushroom:vitality-mushroom");
    if (!card) {
      throw new Error("VitalityMushroom card is missing");
    }

    model.placeCells(
      [{ x: 1, y: 1 }],
      card.essence,
      TEST_PROVENANCE,
      card.behaviors,
    );

    expect(model.getLivingCount()).toBe(1);
    expect(model.getTile(1, 1)?.getData()?.getReproducibility()).toBe(10);
  });
});

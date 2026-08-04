import { describe, expect, it } from "vitest";
import { StaticEssence, TreeEssence } from "../MapManager/main";
import {
  DEFAULT_ESSENCE_DEFINITION,
  ESSENCE_DEFINITIONS,
  getCardsForEssence,
} from "./Cards";

const LIFE_PATTERN_IDS = [
  "genesis",
  "glider",
  "lwss",
  "mwss",
  "blinker",
  "toad",
  "replicator",
  "cell",
];

describe("CellCreator cards", () => {
  it("lists every application essence with Conway selected by default", () => {
    expect(ESSENCE_DEFINITIONS.map(({ id }) => id)).toEqual([
      "game-of-life",
      "high-life",
      "static",
      "mushroom",
      "tree",
    ]);
    expect(DEFAULT_ESSENCE_DEFINITION.id).toBe("game-of-life");
  });

  it("offers the Tree essence", () => {
    const definition = ESSENCE_DEFINITIONS.find(({ id }) => id === "tree");

    expect(definition?.label).toBe("Tree");
    expect(definition?.essence).toBeInstanceOf(TreeEssence);
  });

  it("duplicates all existing patterns for Conway and HighLife", () => {
    expect(
      getCardsForEssence("game-of-life").map(({ id }) => id.split(":")[1]),
    ).toEqual(LIFE_PATTERN_IDS);
    expect(
      getCardsForEssence("high-life").map(({ id }) => id.split(":")[1]),
    ).toEqual(LIFE_PATTERN_IDS);
  });

  it("gives Static only its single-cell card", () => {
    const cards = getCardsForEssence("static");

    expect(cards.map(({ id }) => id)).toEqual(["static:cell"]);
    expect(cards[0]?.essence).toBeInstanceOf(StaticEssence);
    expect(cards[0]?.pattern.getCells()).toEqual([{ x: 0, y: 0 }]);
  });

  it("gives Mushroom a cell and a horizontal three-cell line", () => {
    const cards = getCardsForEssence("mushroom");

    expect(cards.map(({ id }) => id)).toEqual([
      "mushroom:cell",
      "mushroom:horizontal-line",
    ]);
    expect(cards[1]?.pattern.getCells()).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]);
  });

  it("gives Tree a cell and a five-cell cross", () => {
    const cards = getCardsForEssence("tree");

    expect(cards.map(({ id }) => id)).toEqual([
      "tree:cell",
      "tree:five-cell-cross",
    ]);
    expect(cards[1]?.pattern.getCells()).toEqual([
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ]);
  });

  it("associates every card with its catalog essence", () => {
    for (const definition of ESSENCE_DEFINITIONS) {
      for (const card of getCardsForEssence(definition.id)) {
        expect(card.essence).toBe(definition.essence);
      }
    }
  });

  it("exposes stateless essence definitions with base properties", () => {
    for (const definition of ESSENCE_DEFINITIONS) {
      expect(definition.essence.getInitialProperties()).toEqual({
        life: 100,
        maximumLife: 100,
      });
    }
  });
});

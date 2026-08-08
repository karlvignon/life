import { describe, expect, it } from "vitest";
import {
  BlindSeeding,
  FloraEssence,
  MushroomSproutEssence,
  SeedRange,
  StaticEssence,
  TreeEssence,
} from "../MapManager/main";
import {
  DEFAULT_ESSENCE_DEFINITION,
  ESSENCE_DEFINITIONS,
  getCardsForEssence,
} from "./Cards";

const LIFE_PATTERN_IDS = [
  "start",
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
      "flora",
      "tree",
    ]);
    expect(DEFAULT_ESSENCE_DEFINITION.id).toBe("game-of-life");
  });

  it("offers the Tree essence", () => {
    const definition = ESSENCE_DEFINITIONS.find(({ id }) => id === "tree");

    expect(definition?.label).toBe("Tree");
    expect(definition?.essence).toBeInstanceOf(TreeEssence);
  });

  it("offers Flora with cell and birth-pattern cards", () => {
    const definition = ESSENCE_DEFINITIONS.find(({ id }) => id === "flora");
    const cards = getCardsForEssence("flora");

    expect(definition?.label).toBe("Flora");
    expect(definition?.essence).toBeInstanceOf(FloraEssence);
    expect(cards.map(({ id }) => id)).toEqual([
      "flora:start",
      "flora:cell",
      "flora:flora-birth",
    ]);
    expect(cards[2]?.pattern.getCells()).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ]);
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

    expect(cards.map(({ id }) => id)).toEqual(["static:start", "static:cell"]);
    expect(cards[1]?.essence).toBeInstanceOf(StaticEssence);
    expect(cards[1]?.pattern.getCells()).toEqual([{ x: 0, y: 0 }]);
  });

  it("gives Mushroom its existing cards and its birth pattern", () => {
    const cards = getCardsForEssence("mushroom");

    expect(cards.map(({ id }) => id)).toEqual([
      "mushroom:start",
      "mushroom:cell",
      "mushroom:horizontal-line",
      "mushroom:mushroom-birth",
      "mushroom:mushroom-sprout",
    ]);
    expect(cards[2]?.pattern.getCells()).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]);
    expect(cards[3]?.pattern.getCells()).toEqual([
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ]);
    expect(cards[4]?.pattern.getCells()).toEqual([
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ]);
    expect(cards[4]?.pattern.getBounds()).toEqual({ width: 3, height: 3 });
    expect(cards[4]?.essence).toBeInstanceOf(MushroomSproutEssence);
    expect(cards[4]?.essence.id).toBe("mushroom-sprout");
    expect(cards[4]?.essence.getInitialProperties().reproducibility).toBe(7);
    expect(cards[1]?.essence).toBe(cards[2]?.essence);
    expect(cards[2]?.essence).toBe(cards[3]?.essence);
    expect(cards[3]?.essence).not.toBe(cards[4]?.essence);
  });

  it("gives Tree its existing cards and its birth pattern", () => {
    const cards = getCardsForEssence("tree");

    expect(cards.map(({ id }) => id)).toEqual([
      "tree:start",
      "tree:cell",
      "tree:five-cell-cross",
      "tree:tree-birth",
    ]);
    expect(cards[2]?.pattern.getCells()).toEqual([
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ]);
    expect(cards[3]?.pattern.getCells()).toEqual([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 2 },
      { x: 2, y: 2 },
    ]);
  });

  it("associates every card with its catalog family", () => {
    for (const definition of ESSENCE_DEFINITIONS) {
      for (const card of getCardsForEssence(definition.id)) {
        expect(card.familyId).toBe(definition.id);
      }
    }
  });

  it("gives every selectable essence a one-cell BlindSeeding START card", () => {
    for (const definition of ESSENCE_DEFINITIONS) {
      const cards = getCardsForEssence(definition.id);
      const startCard = cards.find((card) => card.label === "START");

      expect(startCard?.id).toBe(`${definition.id}:start`);
      expect(startCard?.pattern.getCells()).toEqual([{ x: 0, y: 0 }]);
      expect(startCard?.essence).toBe(definition.essence);
      expect(startCard?.behaviors).toHaveLength(2);
      expect(
        startCard?.behaviors.find(
          (behavior): behavior is SeedRange => behavior instanceof SeedRange,
        )?.value,
      ).toBe(4);
      expect(
        startCard?.behaviors.some(
          (behavior) => behavior instanceof BlindSeeding,
        ),
      ).toBe(true);

      for (const card of cards.filter((card) => card !== startCard)) {
        expect(card.behaviors).toHaveLength(1);
        expect(card.behaviors[0]).toBeInstanceOf(SeedRange);
        expect((card.behaviors[0] as SeedRange).value).toBe(3);
      }
    }
  });

  it("exposes stateless essence definitions with base properties", () => {
    for (const definition of ESSENCE_DEFINITIONS) {
      expect(definition.essence.getInitialProperties()).toEqual({
        life: 100,
        maximumLife: 100,
        reproducibility: 10,
      });
    }
  });
});

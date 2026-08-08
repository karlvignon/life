import { describe, expect, it } from "vitest";
import {
  BehaviorInheritanceScore,
  BlindSeeding,
  FloraEssence,
  LifecycleEffectsBehavior,
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
      "mushroom:vitality-mushroom",
      "mushroom:horizontal-line",
      "mushroom:mushroom-birth",
      "mushroom:mushroom-sprout",
    ]);
    const vitality = cards.find(
      ({ id }) => id === "mushroom:vitality-mushroom",
    );
    const horizontal = cards.find(
      ({ id }) => id === "mushroom:horizontal-line",
    );
    const birthPattern = cards.find(
      ({ id }) => id === "mushroom:mushroom-birth",
    );
    const sprout = cards.find(({ id }) => id === "mushroom:mushroom-sprout");

    expect(vitality?.label).toBe("VitalityMushroom");
    expect(vitality?.pattern.getCells()).toEqual([{ x: 0, y: 0 }]);
    expect(vitality?.behaviors[1]).toBeInstanceOf(LifecycleEffectsBehavior);
    expect(vitality?.behaviors[1]?.inheritableScore).toBe(
      BehaviorInheritanceScore.INFINITE,
    );
    expect(horizontal?.pattern.getCells()).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]);
    expect(birthPattern?.pattern.getCells()).toEqual([
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ]);
    expect(sprout?.pattern.getCells()).toEqual([
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ]);
    expect(sprout?.pattern.getBounds()).toEqual({ width: 3, height: 3 });
    expect(sprout?.essence).toBeInstanceOf(MushroomSproutEssence);
    expect(sprout?.essence.id).toBe("mushroom-sprout");
    expect(sprout?.essence.getInitialProperties().reproducibility).toBe(7);
    expect(vitality?.essence).toBe(cards[1]?.essence);
    expect(horizontal?.essence).toBe(cards[1]?.essence);
    expect(birthPattern?.essence).toBe(cards[1]?.essence);
    expect(birthPattern?.essence).not.toBe(sprout?.essence);
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

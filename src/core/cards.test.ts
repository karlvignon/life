import { describe, expect, it } from "vitest";
import {
  CARD_DEFINITIONS,
  ESSENCE_DEFINITIONS,
  createCardId,
  getCardDefinition,
} from "./cards";
import { BehaviorInheritanceScore } from "./types/cards";

describe("card definitions", () => {
  it("owns the selectable essence references", () => {
    expect(ESSENCE_DEFINITIONS).toEqual([
      { id: "game-of-life", label: "Conway", defaultEssenceId: "game-of-life" },
      { id: "high-life", label: "HighLife", defaultEssenceId: "high-life" },
      { id: "static", label: "Static", defaultEssenceId: "static" },
      { id: "mushroom", label: "Mushroom", defaultEssenceId: "mushroom" },
      { id: "flora", label: "Flora", defaultEssenceId: "flora" },
      { id: "tree", label: "Tree", defaultEssenceId: "tree" },
    ]);
  });

  it("declares every card combination exactly once", () => {
    const ids = CARD_DEFINITIONS.map(({ familyId, patternId }) =>
      createCardId(familyId, patternId),
    );

    expect(ids).toHaveLength(33);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contains the complete essence catalogs", () => {
    const idsFor = (familyId: (typeof CARD_DEFINITIONS)[number]["familyId"]) =>
      CARD_DEFINITIONS.filter(
        (definition) => definition.familyId === familyId,
      ).map(({ patternId }) => patternId);

    expect(idsFor("game-of-life")).toEqual([
      "start",
      "genesis",
      "glider",
      "lwss",
      "mwss",
      "blinker",
      "toad",
      "replicator",
      "cell",
    ]);
    expect(idsFor("high-life")).toEqual(idsFor("game-of-life"));
    expect(idsFor("static")).toEqual(["start", "cell"]);
    expect(idsFor("mushroom")).toEqual([
      "start",
      "cell",
      "vitality-mushroom",
      "horizontal-line",
      "mushroom-birth",
      "mushroom-sprout",
    ]);
    expect(idsFor("flora")).toEqual(["start", "cell", "flora-birth"]);
    expect(idsFor("tree")).toEqual([
      "start",
      "cell",
      "five-cell-cross",
      "tree-birth",
    ]);
  });

  it("resolves only combinations declared by the core catalog", () => {
    expect(getCardDefinition("tree", "five-cell-cross")?.label).toBe(
      "5-cell cross",
    );
    expect(getCardDefinition("static", "glider")).toBeUndefined();
    expect(getCardDefinition("mushroom", "rle")).toBeUndefined();
  });

  it("declares a positive stamina cost for every card", () => {
    for (const definition of CARD_DEFINITIONS) {
      expect(definition.staminaCost).toBeGreaterThan(0);
    }
  });

  it("declares range 3 on regular cards and range 4 plus BlindSeeding on START", () => {
    for (const definition of CARD_DEFINITIONS) {
      if (definition.patternId === "start") {
        expect(definition.behaviors).toEqual([
          { type: "seed-range", value: 4 },
          { type: "blind-seeding" },
        ]);
      } else {
        expect(definition.behaviors?.[0]).toEqual({
          type: "seed-range",
          value: 3,
        });
      }
    }
  });

  it("declares VitalityMushroom as an infinitely transmissible one-cell birth hook", () => {
    const definition = getCardDefinition("mushroom", "vitality-mushroom");
    const behavior = definition?.behaviors?.[1];

    expect(definition?.label).toBe("VitalityMushroom");
    expect(behavior?.type).toBe("lifecycle-effects");
    if (behavior?.type !== "lifecycle-effects") {
      throw new Error("VitalityMushroom lifecycle behavior is missing");
    }
    expect(behavior.inheritableScore).toBe(BehaviorInheritanceScore.INFINITE);
    expect(behavior.onBirth).toHaveLength(8);
    expect(
      behavior.onBirth?.every(
        (effect) =>
          effect.type === "tile-data:add" &&
          effect.property === "reproducibility" &&
          effect.value === 5,
      ),
    ).toBe(true);
  });
});

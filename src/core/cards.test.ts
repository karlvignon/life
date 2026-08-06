import { describe, expect, it } from "vitest";
import {
  CARD_DEFINITIONS,
  ESSENCE_DEFINITIONS,
  createCardId,
  getCardDefinition,
} from "./cards";

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

    expect(ids).toHaveLength(26);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contains the complete essence catalogs", () => {
    const idsFor = (familyId: (typeof CARD_DEFINITIONS)[number]["familyId"]) =>
      CARD_DEFINITIONS.filter(
        (definition) => definition.familyId === familyId,
      ).map(({ patternId }) => patternId);

    expect(idsFor("game-of-life")).toEqual([
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
    expect(idsFor("static")).toEqual(["cell"]);
    expect(idsFor("mushroom")).toEqual([
      "cell",
      "horizontal-line",
      "mushroom-birth",
      "mushroom-sprout",
    ]);
    expect(idsFor("flora")).toEqual(["cell", "flora-birth"]);
    expect(idsFor("tree")).toEqual(["cell", "five-cell-cross", "tree-birth"]);
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
});

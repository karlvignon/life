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
      { id: "game-of-life", label: "Conway" },
      { id: "high-life", label: "HighLife" },
      { id: "static", label: "Static" },
      { id: "mushroom", label: "Mushroom" },
      { id: "tree", label: "Tree" },
    ]);
  });

  it("declares every card combination exactly once", () => {
    const ids = CARD_DEFINITIONS.map(({ essenceId, patternId }) =>
      createCardId(essenceId, patternId),
    );

    expect(ids).toHaveLength(21);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contains the complete essence catalogs", () => {
    const idsFor = (
      essenceId: (typeof CARD_DEFINITIONS)[number]["essenceId"],
    ) =>
      CARD_DEFINITIONS.filter(
        (definition) => definition.essenceId === essenceId,
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
    expect(idsFor("mushroom")).toEqual(["cell", "horizontal-line"]);
    expect(idsFor("tree")).toEqual(["cell", "five-cell-cross"]);
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

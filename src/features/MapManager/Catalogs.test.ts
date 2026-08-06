import { describe, expect, it } from "vitest";
import { CARD_DEFINITIONS, ESSENCE_DEFINITIONS } from "../../core/cards";
import {
  createEssence,
  EssenceCatalog,
  essenceCatalog,
} from "./model/essences/EssenceCatalog";
import { Essence } from "./model/essences/Essence";
import { createPattern, PatternCatalog } from "./model/patterns/PatternCatalog";

describe("MapManager catalogs", () => {
  it("creates every essence referenced by the core", () => {
    for (const definition of ESSENCE_DEFINITIONS) {
      expect(createEssence(definition.defaultEssenceId).id).toBe(
        definition.defaultEssenceId,
      );
    }
  });

  it("resolves every concrete card essence, including variants", () => {
    for (const definition of CARD_DEFINITIONS) {
      const family = ESSENCE_DEFINITIONS.find(
        ({ id }) => id === definition.familyId,
      )!;
      const essenceId = definition.essenceId ?? family.defaultEssenceId;

      expect(essenceCatalog.get(essenceId).id).toBe(essenceId);
    }
  });

  it("creates every card pattern referenced by the core", () => {
    const patternIds = new Set(
      CARD_DEFINITIONS.map((definition) => definition.patternId),
    );

    for (const patternId of patternIds) {
      expect(createPattern(patternId).id).toBe(patternId);
    }
  });

  it("accepts a new essence id without changing a TypeScript union", () => {
    const customCatalog = new EssenceCatalog([
      [
        "custom-runtime-essence",
        () =>
          new Essence({
            id: "custom-runtime-essence",
            name: "Custom",
            color: 0x123456,
          }),
      ],
    ]);

    expect(customCatalog.get("custom-runtime-essence").name).toBe("Custom");
  });

  it("accepts a new encoded pattern without adding a specific class", () => {
    const customCatalog = new PatternCatalog([
      { id: "custom-cross", encoding: "x=3;y=3;cells=010111010" },
    ]);

    expect(customCatalog.create("custom-cross").getCells()).toEqual([
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ]);
  });

  it("validates encoded patterns when the catalog is created", () => {
    expect(
      () =>
        new PatternCatalog([{ id: "invalid", encoding: "x=2;y=2;cells=101" }]),
    ).toThrow("exactly 4 bits");
  });
});

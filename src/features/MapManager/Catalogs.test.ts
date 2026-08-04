import { describe, expect, it } from "vitest";
import { CARD_DEFINITIONS, ESSENCE_DEFINITIONS } from "../../core/cards";
import { createEssence } from "./model/essences/EssenceCatalog";
import { createPattern } from "./model/patterns/PatternCatalog";

describe("MapManager catalogs", () => {
  it("creates every essence referenced by the core", () => {
    for (const definition of ESSENCE_DEFINITIONS) {
      expect(createEssence(definition.id).id).toBe(definition.id);
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
});

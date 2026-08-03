import { describe, expect, it } from "vitest";
import { StaticEssence } from "../MapManager/main";
import {
  DEFAULT_ESSENCE_DEFINITION,
  ESSENCE_DEFINITIONS,
  PATTERN_DEFINITIONS,
} from "./CreateCellButtons";

describe("CellCreator definitions", () => {
  it("lists every application essence with Conway selected by default", () => {
    expect(ESSENCE_DEFINITIONS.map(({ id }) => id)).toEqual([
      "game-of-life",
      "high-life",
      "static",
      "mushroom",
    ]);
    expect(DEFAULT_ESSENCE_DEFINITION.id).toBe("game-of-life");
  });

  it("builds every toolbar pattern with the selected essence instance", () => {
    const selectedEssence = new StaticEssence();

    for (const definition of PATTERN_DEFINITIONS) {
      expect(definition.createPattern(selectedEssence).getEssence()).toBe(
        selectedEssence,
      );
    }
  });

  it("exposes stateless essence definitions with base properties", () => {
    for (const definition of ESSENCE_DEFINITIONS) {
      expect(definition.essence.getInitialProperties()).toEqual({ life: 100 });
    }
  });
});

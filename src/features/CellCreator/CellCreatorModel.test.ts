import { describe, expect, it } from "vitest";
import {
  GameOfLifeEssence,
  HighLifeEssence,
  SingleCellPattern,
} from "../MapManager/main";
import { CellCreatorModel } from "./CellCreatorModel";
import type { EssenceDefinition, PatternDefinition } from "./types";

const conwayDefinition: EssenceDefinition = {
  id: "game-of-life",
  label: "Conway",
  essence: new GameOfLifeEssence(),
};

const highLifeDefinition: EssenceDefinition = {
  id: "high-life",
  label: "HighLife",
  essence: new HighLifeEssence(),
};

const cellPatternDefinition: PatternDefinition = {
  id: "cell",
  label: "Cell",
  createPattern: (essence) => new SingleCellPattern(essence),
};

describe("CellCreatorModel", () => {
  it("starts with the provided essence and no selected pattern", () => {
    const model = new CellCreatorModel(conwayDefinition);

    expect(model.getSelectedEssence()).toBe(conwayDefinition.essence);
    expect(model.getSelectedPatternId()).toBeNull();
    expect(model.getSelectedPlaceable()).toBeNull();
  });

  it("uses the selected essence when selecting a pattern", () => {
    const model = new CellCreatorModel(conwayDefinition);

    model.toggleSelectedPattern(cellPatternDefinition);

    expect(model.getSelectedPatternId()).toBe(cellPatternDefinition.id);
    expect(model.getSelectedPlaceable()?.getEssence()).toBe(
      conwayDefinition.essence,
    );
  });

  it("rebuilds the active pattern immediately when the essence changes", () => {
    const model = new CellCreatorModel(conwayDefinition);
    model.toggleSelectedPattern(cellPatternDefinition);
    model.setPreviewOrigin({ x: 4, y: 7 });

    model.setSelectedEssence(highLifeDefinition);

    expect(model.getSelectedPatternId()).toBe(cellPatternDefinition.id);
    expect(model.getSelectedPlaceable()?.getEssence()).toBe(
      highLifeDefinition.essence,
    );
    expect(model.getPreviewPlaceable()?.getOrigin()).toEqual({ x: 4, y: 7 });
  });

  it("toggles off the active pattern without clearing the essence", () => {
    const model = new CellCreatorModel(conwayDefinition);
    model.toggleSelectedPattern(cellPatternDefinition);

    model.toggleSelectedPattern(cellPatternDefinition);

    expect(model.getSelectedPatternId()).toBeNull();
    expect(model.getSelectedPlaceable()).toBeNull();
    expect(model.getSelectedEssence()).toBe(conwayDefinition.essence);
  });
});

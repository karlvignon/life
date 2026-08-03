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

    expect(model.getSelectedEssence()).toBeInstanceOf(GameOfLifeEssence);
    expect(model.getSelectedPatternId()).toBeNull();
    expect(model.getSelectedPlaceable()).toBeNull();
  });

  it("uses the selected essence when selecting a pattern", () => {
    const model = new CellCreatorModel(conwayDefinition);

    model.toggleSelectedPattern(cellPatternDefinition);

    expect(model.getSelectedPatternId()).toBe(cellPatternDefinition.id);
    expect(model.getSelectedPlaceable()?.getEssence()).toBe(
      model.getSelectedEssence(),
    );
  });

  it("rebuilds the active pattern immediately when the essence changes", () => {
    const model = new CellCreatorModel(conwayDefinition);
    model.toggleSelectedPattern(cellPatternDefinition);
    model.setPreviewOrigin({ x: 4, y: 7 });

    model.setSelectedEssence(highLifeDefinition);

    expect(model.getSelectedPatternId()).toBe(cellPatternDefinition.id);
    expect(model.getSelectedPlaceable()?.getEssence()).toBe(
      model.getSelectedEssence(),
    );
    expect(model.getSelectedEssence()).toBeInstanceOf(HighLifeEssence);
    expect(model.getPreviewPlaceable()?.getOrigin()).toEqual({ x: 4, y: 7 });
  });

  it("toggles off the active pattern without clearing the essence", () => {
    const model = new CellCreatorModel(conwayDefinition);
    model.toggleSelectedPattern(cellPatternDefinition);

    model.toggleSelectedPattern(cellPatternDefinition);

    expect(model.getSelectedPatternId()).toBeNull();
    expect(model.getSelectedPlaceable()).toBeNull();
    expect(model.getSelectedEssence()).toBeInstanceOf(GameOfLifeEssence);
  });

  it("creates placements from the selected stateless essence definition", () => {
    const model = new CellCreatorModel(conwayDefinition);
    model.toggleSelectedPattern(cellPatternDefinition);
    model.setPreviewOrigin({ x: 2, y: 3 });

    const firstPlacement = model.createPlacement();
    const secondPlacement = model.createPlacement();
    expect(firstPlacement?.getOrigin()).toEqual({ x: 2, y: 3 });
    expect(firstPlacement?.getEssence()).toBe(conwayDefinition.essence);
    expect(secondPlacement?.getEssence()).toBe(conwayDefinition.essence);
  });
});

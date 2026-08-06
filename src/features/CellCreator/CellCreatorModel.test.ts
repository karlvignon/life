import { describe, expect, it } from "vitest";
import { getCardDefinition } from "../../core/cards";
import {
  GameOfLifeEssence,
  HighLifeEssence,
  MushroomSproutEssence,
  createPattern,
} from "../MapManager/main";
import { Card } from "./Card";
import { CellCreatorModel } from "./CellCreatorModel";
import type { EssenceDefinition } from "./types";

const conwayEssence = new GameOfLifeEssence();
const conwayDefinition: EssenceDefinition = {
  id: "game-of-life",
  label: "Conway",
  essence: conwayEssence,
};

const highLifeEssence = new HighLifeEssence();
const highLifeDefinition: EssenceDefinition = {
  id: "high-life",
  label: "HighLife",
  essence: highLifeEssence,
};

const conwayCellCard = new Card(
  getCardDefinition("game-of-life", "cell")!,
  createPattern("cell"),
  conwayEssence,
);
const highLifeCellCard = new Card(
  getCardDefinition("high-life", "cell")!,
  createPattern("cell"),
  highLifeEssence,
);

describe("CellCreatorModel", () => {
  it("starts with the provided essence and no selected pattern", () => {
    const model = new CellCreatorModel(conwayDefinition);

    expect(model.getSelectedEssence()).toBeInstanceOf(GameOfLifeEssence);
    expect(model.getSelectedCardId()).toBeNull();
    expect(model.getSelectedPlaceable()).toBeNull();
  });

  it("selects a card that belongs to the active essence", () => {
    const model = new CellCreatorModel(conwayDefinition);

    model.toggleSelectedCard(conwayCellCard);

    expect(model.getSelectedCardId()).toBe(conwayCellCard.id);
    expect(model.getSelectedCardStaminaCost()).toBe(conwayCellCard.staminaCost);
    expect(model.getSelectedPlaceable()?.getEssence()).toBe(conwayEssence);
  });

  it("selects a card-specific essence variant from the active catalog", () => {
    const mushroomEssence = new MushroomSproutEssence();
    const mushroomDefinition: EssenceDefinition = {
      id: "mushroom",
      label: "Mushroom",
      essence: new MushroomSproutEssence(),
    };
    const card = new Card(
      getCardDefinition("mushroom", "mushroom-sprout")!,
      createPattern("mushroom-sprout"),
      mushroomEssence,
    );
    const model = new CellCreatorModel(mushroomDefinition);

    model.toggleSelectedCard(card);

    expect(model.getSelectedPlaceable()?.getEssence()).toBe(mushroomEssence);
  });

  it("clears the selected card when the essence changes", () => {
    const model = new CellCreatorModel(conwayDefinition);
    model.toggleSelectedCard(conwayCellCard);
    model.setPreviewOrigin({ x: 4, y: 7 });

    model.setSelectedEssence(highLifeDefinition);

    expect(model.getSelectedEssence()).toBeInstanceOf(HighLifeEssence);
    expect(model.getSelectedCardId()).toBeNull();
    expect(model.getSelectedCardStaminaCost()).toBeNull();
    expect(model.getSelectedPlaceable()).toBeNull();
    expect(model.getPreviewPlaceable()).toBeNull();
  });

  it("rejects a card from another essence", () => {
    const model = new CellCreatorModel(conwayDefinition);

    model.toggleSelectedCard(highLifeCellCard);

    expect(model.getSelectedCardId()).toBeNull();
    expect(model.getSelectedPlaceable()).toBeNull();
  });

  it("toggles off the active card without clearing the essence", () => {
    const model = new CellCreatorModel(conwayDefinition);
    model.toggleSelectedCard(conwayCellCard);

    model.toggleSelectedCard(conwayCellCard);

    expect(model.getSelectedCardId()).toBeNull();
    expect(model.getSelectedPlaceable()).toBeNull();
    expect(model.getSelectedEssence()).toBeInstanceOf(GameOfLifeEssence);
  });

  it("creates placements from the selected card", () => {
    const model = new CellCreatorModel(conwayDefinition);
    model.toggleSelectedCard(conwayCellCard);
    model.setPreviewOrigin({ x: 2, y: 3 });

    const firstPlacement = model.createPlacement();
    const secondPlacement = model.createPlacement();
    expect(firstPlacement?.getOrigin()).toEqual({ x: 2, y: 3 });
    expect(firstPlacement?.getEssence()).toBe(conwayCellCard.essence);
    expect(secondPlacement?.getEssence()).toBe(conwayCellCard.essence);
  });
});

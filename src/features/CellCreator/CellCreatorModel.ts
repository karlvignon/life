import {
  Placeable,
  type Essence,
  type PlaceableRotation,
} from "../MapManager/main";
import type { CellOffset } from "../../core/types/grid";
import type { Card } from "./Card";
import type { CardId, EssenceDefinition } from "./types";

export class CellCreatorModel {
  private selectedEssence: EssenceDefinition;
  private selectedCard: Card | null = null;
  private selectedPlaceable: Placeable | null = null;
  private previewOrigin: CellOffset | null = null;
  private placementRotation: PlaceableRotation = 0;

  constructor(initialEssence: EssenceDefinition) {
    this.selectedEssence = initialEssence;
  }

  setSelectedEssence(definition: EssenceDefinition): void {
    if (this.selectedEssence.id === definition.id) {
      return;
    }

    this.selectedEssence = definition;
    this.clearSelectedCard();
  }

  getSelectedEssence(): Essence {
    return this.selectedEssence.essence;
  }

  getSelectedEssenceDefinition(): EssenceDefinition {
    return this.selectedEssence;
  }

  toggleSelectedCard(card: Card): void {
    if (card.familyId !== this.selectedEssence.id) {
      return;
    }

    if (this.selectedCard?.id === card.id) {
      this.clearSelectedCard();
      return;
    }

    this.selectedCard = card;
    this.previewOrigin = null;
    this.placementRotation = 0;
    this.selectedPlaceable = new Placeable(
      card.pattern,
      card.essence,
      0,
      0,
      card.behaviors,
    );
  }

  clearSelectedCard(): void {
    this.selectedCard = null;
    this.selectedPlaceable = null;
    this.previewOrigin = null;
    this.placementRotation = 0;
  }

  getSelectedCardId(): CardId | null {
    return this.selectedCard?.id ?? null;
  }

  getSelectedCardStaminaCost(): number | null {
    return this.selectedCard?.staminaCost ?? null;
  }

  getSelectedPlaceable(): Placeable | null {
    return this.selectedPlaceable;
  }

  getPlacementRotation(): PlaceableRotation {
    return this.placementRotation;
  }

  setPlacementRotation(rotation: PlaceableRotation): void {
    this.placementRotation = rotation;
    this.selectedPlaceable =
      this.selectedPlaceable?.withRotation(rotation) ?? null;
  }

  rotatePlacementClockwise(): void {
    const nextRotation = ((this.placementRotation + 90) %
      360) as PlaceableRotation;
    this.setPlacementRotation(nextRotation);
  }

  setPreviewOrigin(origin: CellOffset | null): void {
    this.previewOrigin = origin;
  }

  getPreviewPlaceable(): Placeable | null {
    if (!this.selectedPlaceable || !this.previewOrigin) {
      return null;
    }

    return this.selectedPlaceable.withOrigin(
      this.previewOrigin.x,
      this.previewOrigin.y,
    );
  }

  createPlacement(): Placeable | null {
    if (!this.selectedPlaceable || !this.previewOrigin) {
      return null;
    }

    return this.selectedPlaceable.withOrigin(
      this.previewOrigin.x,
      this.previewOrigin.y,
    );
  }
}

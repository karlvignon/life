import { Placeable, type Essence } from "../MapManager/main";
import type { CellOffset } from "../../core/types/grid";
import type { Card } from "./Card";
import type { CardId, EssenceDefinition } from "./types";

export class CellCreatorModel {
  private selectedEssence: EssenceDefinition;
  private selectedCard: Card | null = null;
  private selectedPlaceable: Placeable | null = null;
  private previewOrigin: CellOffset | null = null;

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
    this.selectedPlaceable = new Placeable(card.pattern, card.essence, 0, 0);
  }

  clearSelectedCard(): void {
    this.selectedCard = null;
    this.selectedPlaceable = null;
    this.previewOrigin = null;
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
    if (!this.selectedCard || !this.previewOrigin) {
      return null;
    }

    return new Placeable(
      this.selectedCard.pattern,
      this.selectedCard.essence,
      this.previewOrigin.x,
      this.previewOrigin.y,
    );
  }
}

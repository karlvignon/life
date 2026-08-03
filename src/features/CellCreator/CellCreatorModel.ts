import { Placeable, type Essence } from "../MapManager/main";
import type { CellOffset } from "../../core/types/grid";
import type { EssenceDefinition, PatternDefinition, PatternId } from "./types";

export class CellCreatorModel {
  private selectedEssence: EssenceDefinition;
  private selectedPattern: PatternDefinition | null = null;
  private selectedPlaceable: Placeable | null = null;
  private previewOrigin: CellOffset | null = null;

  constructor(initialEssence: EssenceDefinition) {
    this.selectedEssence = initialEssence;
  }

  setSelectedEssence(definition: EssenceDefinition): void {
    this.selectedEssence = definition;
    this.rebuildSelectedPlaceable();
  }

  getSelectedEssence(): Essence {
    return this.selectedEssence.essence;
  }

  getSelectedEssenceDefinition(): EssenceDefinition {
    return this.selectedEssence;
  }

  toggleSelectedPattern(definition: PatternDefinition): void {
    if (this.selectedPattern?.id === definition.id) {
      this.clearSelectedPattern();
      return;
    }

    this.selectedPattern = definition;
    this.previewOrigin = null;
    this.rebuildSelectedPlaceable();
  }

  clearSelectedPattern(): void {
    this.selectedPattern = null;
    this.selectedPlaceable = null;
    this.previewOrigin = null;
  }

  getSelectedPatternId(): PatternId | null {
    return this.selectedPattern?.id ?? null;
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
    if (!this.selectedPattern || !this.previewOrigin) {
      return null;
    }

    const pattern = this.selectedPattern.createPattern(
      this.selectedEssence.essence,
    );
    return new Placeable(pattern, this.previewOrigin.x, this.previewOrigin.y);
  }

  private rebuildSelectedPlaceable(): void {
    if (!this.selectedPattern) {
      this.selectedPlaceable = null;
      this.previewOrigin = null;
      return;
    }

    const pattern = this.selectedPattern.createPattern(
      this.selectedEssence.essence,
    );
    this.selectedPlaceable = new Placeable(pattern, 0, 0);
  }
}

import type { Placeable } from "../MapManager/main";
import type { CellOffset } from "../../core/types/grid";

export class CellCreatorModel {
  private selectedPlaceable: Placeable | null = null;
  private previewOrigin: CellOffset | null = null;

  setSelectedPlaceable(placeable: Placeable | null): void {
    this.selectedPlaceable = placeable;
    this.previewOrigin = null;
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
}

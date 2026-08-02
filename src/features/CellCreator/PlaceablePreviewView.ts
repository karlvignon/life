import { Container, Graphics } from "pixi.js";
import type { Placeable } from "../MapManager/main";
import { PREVIEW_OPACITY } from "./types";

export class PlaceablePreviewView extends Container {
  private readonly cellGraphics: Graphics[] = [];

  syncPreview(placeable: Placeable | null, cellSize: number): void {
    this.clearGraphics();

    if (!placeable) {
      this.visible = false;
      return;
    }

    this.visible = true;
    this.alpha = PREVIEW_OPACITY;

    const color = placeable.getEssence().color;

    for (const { x, y } of placeable.getWorldCells()) {
      const graphic = new Graphics();
      graphic.rect(0, 0, cellSize, cellSize).fill(color);
      graphic.position.set(x * cellSize, y * cellSize);
      this.addChild(graphic);
      this.cellGraphics.push(graphic);
    }
  }

  private clearGraphics(): void {
    for (const graphic of this.cellGraphics) {
      this.removeChild(graphic);
      graphic.destroy();
    }

    this.cellGraphics.length = 0;
  }

  destroy(): void {
    this.clearGraphics();
    super.destroy({ children: true });
  }
}

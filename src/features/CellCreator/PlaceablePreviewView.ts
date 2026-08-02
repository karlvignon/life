import { Container, Graphics } from "pixi.js";
import type { Placeable } from "../MapManager/main";

export class PlaceablePreviewView extends Container {
  private readonly cellGraphics: Graphics[] = [];
  private lastPatternKey: string | null = null;
  private lastCellSize = 0;

  syncPreview(placeable: Placeable | null, cellSize: number): void {
    if (!placeable) {
      this.visible = false;
      return;
    }

    this.visible = true;
    this.alpha = 0.5;

    const origin = placeable.getOrigin();
    const patternKey = `${placeable.getPattern().constructor.name}:${origin.x}:${origin.y}`;
    const worldCells = placeable.getWorldCells();
    const color = placeable.getEssence().color;

    if (
      patternKey !== this.lastPatternKey ||
      cellSize !== this.lastCellSize ||
      this.cellGraphics.length !== worldCells.length
    ) {
      this.rebuildGraphics(worldCells.length, cellSize, color);
      this.lastPatternKey = patternKey;
      this.lastCellSize = cellSize;
    }

    for (let i = 0; i < worldCells.length; i++) {
      const { x, y } = worldCells[i];
      const graphic = this.cellGraphics[i];
      graphic.clear();
      graphic.rect(0, 0, cellSize, cellSize).fill(color);
      graphic.position.set(x * cellSize, y * cellSize);
    }
  }

  private rebuildGraphics(
    count: number,
    cellSize: number,
    color: number,
  ): void {
    this.clearGraphics();

    for (let i = 0; i < count; i++) {
      const graphic = new Graphics();
      graphic.rect(0, 0, cellSize, cellSize).fill(color);
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
    this.lastPatternKey = null;
  }

  destroy(): void {
    this.clearGraphics();
    super.destroy({ children: true });
  }
}

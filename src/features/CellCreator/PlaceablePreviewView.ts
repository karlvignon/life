import { Container, Graphics } from "pixi.js";
import type { Placeable } from "../MapManager/main";
import { PREVIEW_OPACITY } from "./types";

const DIRECTION_ARROW_COLOR = 0xffffff;
const DIRECTION_ARROW_OPACITY = 0.72;

export class PlaceablePreviewView extends Container {
  private readonly cellLayer = new Container();
  private readonly directionArrow = new Graphics();
  private readonly cellGraphics: Graphics[] = [];
  private lastPatternKey: string | null = null;
  private lastCellSize = 0;

  constructor() {
    super();
    this.eventMode = "none";
    this.cellLayer.alpha = PREVIEW_OPACITY;
    this.directionArrow.alpha = DIRECTION_ARROW_OPACITY;
    this.addChild(this.cellLayer, this.directionArrow);
  }

  syncPreview(placeable: Placeable | null, cellSize: number): void {
    if (!placeable) {
      this.visible = false;
      return;
    }

    this.visible = true;

    const origin = placeable.getOrigin();
    const rotation = placeable.getRotation();
    const patternKey = `${placeable.getPattern().id}:${origin.x}:${origin.y}:${rotation}`;
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

    this.drawDirectionArrow(placeable, cellSize);
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
      this.cellLayer.addChild(graphic);
      this.cellGraphics.push(graphic);
    }
  }

  private drawDirectionArrow(placeable: Placeable, cellSize: number): void {
    const origin = placeable.getOrigin();
    const bounds = placeable.getBounds();
    const rotation = placeable.getRotation();
    const length = Math.max(8, cellSize * 1.25);
    const headSize = Math.max(3, Math.min(cellSize * 0.45, length * 0.42));
    const strokeWidth = Math.max(1.5, Math.min(3, cellSize * 0.12));
    const centerX = (origin.x + bounds.width / 2) * cellSize;
    const centerY = (origin.y + bounds.height / 2) * cellSize;
    const angle = ((rotation - 90) * Math.PI) / 180;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const startX = centerX - (dx * length) / 2;
    const startY = centerY - (dy * length) / 2;
    const tipX = centerX + (dx * length) / 2;
    const tipY = centerY + (dy * length) / 2;
    const perpendicularX = -dy;
    const perpendicularY = dx;
    const headBaseX = tipX - dx * headSize;
    const headBaseY = tipY - dy * headSize;

    this.directionArrow.clear();
    this.directionArrow
      .moveTo(startX, startY)
      .lineTo(tipX, tipY)
      .moveTo(tipX, tipY)
      .lineTo(
        headBaseX + perpendicularX * headSize * 0.65,
        headBaseY + perpendicularY * headSize * 0.65,
      )
      .moveTo(tipX, tipY)
      .lineTo(
        headBaseX - perpendicularX * headSize * 0.65,
        headBaseY - perpendicularY * headSize * 0.65,
      )
      .stroke({
        width: strokeWidth,
        color: DIRECTION_ARROW_COLOR,
        cap: "round",
        join: "round",
      });
  }

  private clearGraphics(): void {
    for (const graphic of this.cellGraphics) {
      this.cellLayer.removeChild(graphic);
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

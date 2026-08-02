import { Container, Graphics } from "pixi.js";
import { Hoverable } from "./Hoverable";
import { MapEventManager } from "./MapEventManager";
import { MapModel } from "./MapModel";
import { DEFAULT_GAME_OF_LIFE_COLOR } from "./GameOfLifeEssence";
import { Tile } from "./Tile";

const DEAD_CELL_COLOR = 0x1a1a2e;
const DEAD_CELL_BORDER_COLOR = 0x2a2a3e;

export class MapView extends Container {
  private readonly model: MapModel;
  private readonly eventManager: MapEventManager;
  readonly cellSize: number;

  private readonly cellGraphics: Graphics[][] = [];
  private readonly hoverables: Hoverable[][] = [];

  constructor(
    model: MapModel,
    eventManager: MapEventManager,
    cellSize: number,
  ) {
    super();

    this.model = model;
    this.eventManager = eventManager;
    this.cellSize = cellSize;

    this.buildGrid();
    this.syncFromModel();
  }

  syncFromModel(): void {
    for (let y = 0; y < this.model.gridHeight; y++) {
      for (let x = 0; x < this.model.gridWidth; x++) {
        const tile = this.model.getTile(x, y);
        if (!tile) {
          continue;
        }

        this.drawCell(x, y, tile);
      }
    }
  }

  rebuild(): void {
    this.destroyGrid();
    this.buildGrid();
    this.syncFromModel();
  }

  destroyGrid(): void {
    for (const row of this.hoverables) {
      for (const hoverable of row) {
        hoverable.destroy();
      }
    }

    for (const row of this.cellGraphics) {
      for (const graphic of row) {
        this.removeChild(graphic);
        graphic.destroy();
      }
    }

    this.cellGraphics.length = 0;
    this.hoverables.length = 0;
  }

  private buildGrid(): void {
    for (let y = 0; y < this.model.gridHeight; y++) {
      this.addRow(y);
    }
  }

  private addRow(y: number): void {
    const graphicsRow: Graphics[] = [];
    const hoverablesRow: Hoverable[] = [];

    for (let x = 0; x < this.model.gridWidth; x++) {
      const tile = this.model.getTile(x, y);
      if (!tile) {
        continue;
      }

      const graphic = this.createCellGraphic(x, y);
      const hoverable = new Hoverable(
        graphic,
        tile,
        this.eventManager,
        this.cellSize,
      );
      hoverable.bind();

      graphicsRow.push(graphic);
      hoverablesRow.push(hoverable);
    }

    this.cellGraphics.push(graphicsRow);
    this.hoverables.push(hoverablesRow);
  }

  private createCellGraphic(x: number, y: number): Graphics {
    const graphic = new Graphics();
    graphic.position.set(x * this.cellSize, y * this.cellSize);
    this.addChild(graphic);
    return graphic;
  }

  private drawCell(x: number, y: number, tile: Tile): void {
    const graphic = this.cellGraphics[y]?.[x];
    if (!graphic) {
      return;
    }

    graphic.clear();

    if (tile.isAlive()) {
      const color = tile.getEssence()?.color ?? DEFAULT_GAME_OF_LIFE_COLOR;
      graphic.rect(0, 0, this.cellSize, this.cellSize).fill(color);
      return;
    }

    graphic
      .rect(0, 0, this.cellSize, this.cellSize)
      .fill(DEAD_CELL_COLOR)
      .stroke({ width: 1, color: DEAD_CELL_BORDER_COLOR });
  }
}

import { Container, Graphics } from "pixi.js";
import {
  cellToChunk,
  chunkKey,
  getChunkCount,
  CHUNK_SIZE,
} from "./render/chunkIndex";
import {
  DEAD_CELL_BORDER_COLOR,
  DEAD_CELL_COLOR,
  type CellVisualState,
  type MapRenderSnapshot,
  type MapRenderUpdate,
} from "./render/types";

export class MapView extends Container {
  readonly cellSize: number;

  private readonly backgroundLayer: Graphics;
  private readonly livingLayer: Container;
  private readonly overlayLayer: Container;

  private gridWidth = 0;
  private gridHeight = 0;
  private lastRevision = -1;

  private readonly livingCells = new Map<string, CellVisualState>();
  private readonly chunkGraphics = new Map<string, Graphics>();

  constructor(cellSize: number) {
    super();

    this.cellSize = cellSize;
    this.backgroundLayer = new Graphics();
    this.livingLayer = new Container();
    this.overlayLayer = new Container();

    this.addChild(this.backgroundLayer, this.livingLayer, this.overlayLayer);
  }

  getOverlayLayer(): Container {
    return this.overlayLayer;
  }

  applyUpdate(update: MapRenderUpdate): void {
    if (update.kind === "full") {
      this.rebuildStructure(update.snapshot);
      return;
    }

    if (update.delta.revision <= this.lastRevision) {
      return;
    }

    this.applyDelta(update.delta.changedCells);
    this.lastRevision = update.delta.revision;
  }

  rebuildStructure(snapshot: MapRenderSnapshot): void {
    this.gridWidth = snapshot.gridWidth;
    this.gridHeight = snapshot.gridHeight;
    this.lastRevision = snapshot.revision;

    this.livingCells.clear();
    this.clearLivingLayer();
    this.drawBackground();

    for (const cell of snapshot.livingCells) {
      this.livingCells.set(this.cellKey(cell.x, cell.y), cell);
    }

    this.redrawAllChunks();
  }

  private applyDelta(changedCells: ReadonlyArray<CellVisualState>): void {
    const dirtyChunks = new Set<string>();

    for (const cell of changedCells) {
      const key = this.cellKey(cell.x, cell.y);
      const { cx, cy } = cellToChunk(cell.x, cell.y);
      dirtyChunks.add(chunkKey(cx, cy));

      if (cell.alive) {
        this.livingCells.set(key, cell);
      } else {
        this.livingCells.delete(key);
      }
    }

    for (const key of dirtyChunks) {
      this.redrawChunk(key);
    }
  }

  private drawBackground(): void {
    this.backgroundLayer.clear();

    const cellSize = this.cellSize;

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.backgroundLayer
          .rect(x * cellSize, y * cellSize, cellSize, cellSize)
          .fill(DEAD_CELL_COLOR)
          .stroke({ width: 1, color: DEAD_CELL_BORDER_COLOR });
      }
    }
  }

  private redrawAllChunks(): void {
    const { chunkCols, chunkRows } = getChunkCount(
      this.gridWidth,
      this.gridHeight,
    );

    for (let cy = 0; cy < chunkRows; cy++) {
      for (let cx = 0; cx < chunkCols; cx++) {
        this.redrawChunk(chunkKey(cx, cy));
      }
    }
  }

  private redrawChunk(key: string): void {
    const [cxRaw, cyRaw] = key.split(",").map(Number);
    const cx = cxRaw;
    const cy = cyRaw;

    let graphic = this.chunkGraphics.get(key);
    if (!graphic) {
      graphic = new Graphics();
      this.chunkGraphics.set(key, graphic);
      this.livingLayer.addChild(graphic);
    }

    graphic.clear();

    const startX = cx * CHUNK_SIZE;
    const startY = cy * CHUNK_SIZE;
    const endX = Math.min(startX + CHUNK_SIZE, this.gridWidth);
    const endY = Math.min(startY + CHUNK_SIZE, this.gridHeight);
    const cellSize = this.cellSize;

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const cell = this.livingCells.get(this.cellKey(x, y));
        if (!cell?.alive) {
          continue;
        }

        graphic
          .rect(x * cellSize, y * cellSize, cellSize, cellSize)
          .fill(cell.fillColor);
      }
    }
  }

  private clearLivingLayer(): void {
    for (const graphic of this.chunkGraphics.values()) {
      this.livingLayer.removeChild(graphic);
      graphic.destroy();
    }

    this.chunkGraphics.clear();
  }

  private cellKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  destroyGrid(): void {
    this.clearLivingLayer();
    this.backgroundLayer.clear();
    this.livingCells.clear();
    this.overlayLayer.removeChildren();
  }
}

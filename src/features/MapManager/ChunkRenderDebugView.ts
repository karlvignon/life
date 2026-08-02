import { Graphics } from "pixi.js";
import type { ChunkRenderDebugModel } from "./ChunkRenderDebugModel";
import { CHUNK_SIZE } from "./render/chunkIndex";

const BORDER_COLOR = 0x00ff88;
const BORDER_WIDTH = 2;

export class ChunkRenderDebugView extends Graphics {
  constructor(private readonly cellSize: number) {
    super();
    this.eventMode = "none";
  }

  syncFromModel(
    model: ChunkRenderDebugModel,
    gridWidth: number,
    gridHeight: number,
  ): void {
    this.clear();

    for (const marker of model.getMarkers()) {
      const startX = marker.cx * CHUNK_SIZE;
      const startY = marker.cy * CHUNK_SIZE;
      const widthInCells = Math.min(CHUNK_SIZE, gridWidth - startX);
      const heightInCells = Math.min(CHUNK_SIZE, gridHeight - startY);

      if (widthInCells <= 0 || heightInCells <= 0) {
        continue;
      }

      this.rect(
        startX * this.cellSize,
        startY * this.cellSize,
        widthInCells * this.cellSize,
        heightInCells * this.cellSize,
      ).stroke({
        width: BORDER_WIDTH,
        color: BORDER_COLOR,
        alpha: marker.opacity,
      });
    }
  }
}

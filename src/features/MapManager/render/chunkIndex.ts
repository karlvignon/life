export const CHUNK_SIZE = 32;

export interface ChunkCoord {
  readonly cx: number;
  readonly cy: number;
}

export function cellToChunk(x: number, y: number): ChunkCoord {
  return {
    cx: Math.floor(x / CHUNK_SIZE),
    cy: Math.floor(y / CHUNK_SIZE),
  };
}

export function chunkKey(cx: number, cy: number): string {
  return `${cx},${cy}`;
}

export function getChunkCount(
  gridWidth: number,
  gridHeight: number,
): { chunkCols: number; chunkRows: number } {
  return {
    chunkCols: Math.ceil(gridWidth / CHUNK_SIZE),
    chunkRows: Math.ceil(gridHeight / CHUNK_SIZE),
  };
}

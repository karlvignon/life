export interface CellOffset {
  x: number;
  y: number;
}

export interface GridBounds {
  readonly width: number;
  readonly height: number;
}

/** Packed row-major cell index: y * width + x */
export type CellIndex = number;

export function packIndex(x: number, y: number, width: number): CellIndex {
  return y * width + x;
}

export function unpackIndex(index: CellIndex, width: number): CellOffset {
  return { x: index % width, y: Math.floor(index / width) };
}

export function isInBounds(x: number, y: number, bounds: GridBounds): boolean {
  return x >= 0 && x < bounds.width && y >= 0 && y < bounds.height;
}

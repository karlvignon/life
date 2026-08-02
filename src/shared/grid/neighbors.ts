import type { CellIndex, GridBounds } from "../../core/types/grid";
import { packIndex } from "../../core/types/grid";

const MOORE_OFFSETS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
] as const;

export function forEachMooreNeighborIndex(
  index: CellIndex,
  bounds: GridBounds,
  visitor: (neighborIndex: CellIndex) => void,
): void {
  const width = bounds.width;
  const x = index % width;
  const y = Math.floor(index / width);

  for (const [dx, dy] of MOORE_OFFSETS) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < bounds.width && ny >= 0 && ny < bounds.height) {
      visitor(packIndex(nx, ny, width));
    }
  }
}

export function countMooreNeighborsInSet(
  index: CellIndex,
  aliveSet: ReadonlySet<CellIndex>,
  bounds: GridBounds,
): number {
  let count = 0;

  forEachMooreNeighborIndex(index, bounds, (neighborIndex) => {
    if (aliveSet.has(neighborIndex)) {
      count++;
    }
  });

  return count;
}

export function collectMooreNeighborIndices(
  index: CellIndex,
  bounds: GridBounds,
  target: CellIndex[],
): void {
  target.length = 0;

  forEachMooreNeighborIndex(index, bounds, (neighborIndex) => {
    target.push(neighborIndex);
  });
}

export function forEachMooreNeighborInSet(
  index: CellIndex,
  keySet: ReadonlySet<CellIndex>,
  bounds: GridBounds,
  visitor: (neighborIndex: CellIndex) => void,
): void {
  forEachMooreNeighborIndex(index, bounds, (neighborIndex) => {
    if (keySet.has(neighborIndex)) {
      visitor(neighborIndex);
    }
  });
}

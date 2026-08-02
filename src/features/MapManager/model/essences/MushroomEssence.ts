import type {
  Essence,
  EssenceEvolutionInput,
  EssenceEvolutionResult,
} from "./Essence";
import type { CellOffset } from "../../../../core/types/grid";

export const DEFAULT_MUSHROOM_COLOR = 0x8b4513;
const PROPAGATION_INTERVAL = 5;
const CONNECTED_GROUP_SIZE = 3;

function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

function parseCellKey(key: string): CellOffset {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}

function getMooreNeighbors(
  x: number,
  y: number,
  gridWidth: number,
  gridHeight: number,
): CellOffset[] {
  const neighbors: CellOffset[] = [];

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) {
        continue;
      }

      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
        neighbors.push({ x: nx, y: ny });
      }
    }
  }

  return neighbors;
}

function getConnectedNeighborsInSet(
  x: number,
  y: number,
  keySet: ReadonlySet<string>,
): CellOffset[] {
  const neighbors: CellOffset[] = [];

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) {
        continue;
      }

      const nx = x + dx;
      const ny = y + dy;
      if (keySet.has(cellKey(nx, ny))) {
        neighbors.push({ x: nx, y: ny });
      }
    }
  }

  return neighbors;
}

function hasConnectedGroup(
  cells: ReadonlyArray<CellOffset>,
  minSize: number,
): boolean {
  if (cells.length < minSize) {
    return false;
  }

  const keySet = new Set(cells.map(({ x, y }) => cellKey(x, y)));
  const visited = new Set<string>();

  for (const { x, y } of cells) {
    const startKey = cellKey(x, y);
    if (visited.has(startKey)) {
      continue;
    }

    const queue: CellOffset[] = [{ x, y }];
    visited.add(startKey);
    let componentSize = 0;

    while (queue.length > 0) {
      const current = queue.pop()!;
      componentSize++;

      if (componentSize >= minSize) {
        return true;
      }

      for (const neighbor of getConnectedNeighborsInSet(
        current.x,
        current.y,
        keySet,
      )) {
        const neighborKey = cellKey(neighbor.x, neighbor.y);
        if (visited.has(neighborKey)) {
          continue;
        }

        visited.add(neighborKey);
        queue.push(neighbor);
      }
    }
  }

  return false;
}

/** Propagation lente — naissance et mort tous les 50 cycles selon voisinage connecté. */
export class MushroomEssence implements Essence {
  readonly color: number;

  constructor(color: number = DEFAULT_MUSHROOM_COLOR) {
    this.color = color;
  }

  evolve(input: EssenceEvolutionInput): EssenceEvolutionResult {
    const {
      gridWidth,
      gridHeight,
      aliveCells,
      currentCycle,
      otherEssenceCells,
    } = input;

    if (currentCycle % PROPAGATION_INTERVAL !== 0) {
      return { aliveCells: [...aliveCells] };
    }

    const aliveSet = new Set(aliveCells.map(({ x, y }) => cellKey(x, y)));
    const enemySet = new Set(
      otherEssenceCells.map(({ x, y }) => cellKey(x, y)),
    );

    const nextAlive: CellOffset[] = [];

    for (const { x, y } of aliveCells) {
      const enemyNeighbors = getMooreNeighbors(
        x,
        y,
        gridWidth,
        gridHeight,
      ).filter((neighbor) => enemySet.has(cellKey(neighbor.x, neighbor.y)));

      const diesFromEnemies =
        enemyNeighbors.length >= CONNECTED_GROUP_SIZE &&
        hasConnectedGroup(enemyNeighbors, CONNECTED_GROUP_SIZE);

      if (!diesFromEnemies) {
        nextAlive.push({ x, y });
      }
    }

    const candidates = new Set<string>();
    for (const { x, y } of aliveCells) {
      for (const neighbor of getMooreNeighbors(x, y, gridWidth, gridHeight)) {
        const key = cellKey(neighbor.x, neighbor.y);
        if (!aliveSet.has(key) && !enemySet.has(key)) {
          candidates.add(key);
        }
      }
    }

    for (const key of candidates) {
      const { x, y } = parseCellKey(key);
      const mushroomNeighbors = getMooreNeighbors(
        x,
        y,
        gridWidth,
        gridHeight,
      ).filter((neighbor) => aliveSet.has(cellKey(neighbor.x, neighbor.y)));

      const shouldBirth =
        mushroomNeighbors.length === CONNECTED_GROUP_SIZE &&
        hasConnectedGroup(mushroomNeighbors, CONNECTED_GROUP_SIZE);

      if (shouldBirth) {
        nextAlive.push({ x, y });
      }
    }

    return { aliveCells: nextAlive };
  }
}

import type {
  Essence,
  EssenceEvolutionInput,
  EssenceEvolutionResult,
} from "./Essence";
import type { CellOffset } from "./types";

export const DEFAULT_GAME_OF_LIFE_COLOR = 0x00ff88;

function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

function parseCellKey(key: string): CellOffset {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}

/** Règles Conway B3/S23 — chaque groupe évolue indépendamment. */
export class GameOfLifeEssence implements Essence {
  readonly color: number;

  constructor(color: number = DEFAULT_GAME_OF_LIFE_COLOR) {
    this.color = color;
  }

  evolve(input: EssenceEvolutionInput): EssenceEvolutionResult {
    const { gridWidth, gridHeight, aliveCells } = input;
    const aliveSet = new Set(aliveCells.map(({ x, y }) => cellKey(x, y)));

    const candidates = new Set<string>();
    for (const { x, y } of aliveCells) {
      candidates.add(cellKey(x, y));
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
            candidates.add(cellKey(nx, ny));
          }
        }
      }
    }

    const nextAlive: CellOffset[] = [];
    for (const key of candidates) {
      const { x, y } = parseCellKey(key);
      const neighbors = countAliveNeighbors(x, y, aliveSet);
      const alive = aliveSet.has(key);

      const shouldLive = alive
        ? this.shouldSurvive(neighbors)
        : this.shouldBirth(neighbors);

      if (shouldLive) {
        nextAlive.push({ x, y });
      }
    }

    return { aliveCells: nextAlive };
  }

  protected shouldSurvive(neighbors: number): boolean {
    return neighbors === 2 || neighbors === 3;
  }

  protected shouldBirth(neighbors: number): boolean {
    return neighbors === 3;
  }
}

function countAliveNeighbors(
  x: number,
  y: number,
  aliveSet: ReadonlySet<string>,
): number {
  let count = 0;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) {
        continue;
      }

      if (aliveSet.has(cellKey(x + dx, y + dy))) {
        count++;
      }
    }
  }

  return count;
}

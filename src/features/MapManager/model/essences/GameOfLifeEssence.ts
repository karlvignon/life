import type { CellIndex, GridBounds } from "../../../../core/types/grid";
import { packIndex } from "../../../../core/types/grid";
import {
  countMooreNeighborsInSet,
  forEachMooreNeighborIndex,
} from "../../../../shared/grid/neighbors";
import type {
  Essence,
  EssenceEvolutionInput,
  EssenceEvolutionResult,
} from "./Essence";

export const DEFAULT_GAME_OF_LIFE_COLOR = 0x00ff88;

/** Règles Conway B3/S23 — chaque groupe évolue indépendamment. */
export class GameOfLifeEssence implements Essence {
  readonly color: number;

  constructor(color: number = DEFAULT_GAME_OF_LIFE_COLOR) {
    this.color = color;
  }

  evolve(input: EssenceEvolutionInput): EssenceEvolutionResult {
    const { bounds, aliveIndices } = input;
    const candidates = new Set<CellIndex>();

    for (const index of aliveIndices) {
      candidates.add(index);
      forEachMooreNeighborIndex(index, bounds, (neighborIndex) => {
        candidates.add(neighborIndex);
      });
    }

    const nextAlive: CellIndex[] = [];

    for (const index of candidates) {
      const neighbors = countMooreNeighborsInSet(index, aliveIndices, bounds);
      const alive = aliveIndices.has(index);

      const shouldLive = alive
        ? this.shouldSurvive(neighbors)
        : this.shouldBirth(neighbors);

      if (shouldLive) {
        nextAlive.push(index);
      }
    }

    return { aliveIndices: nextAlive };
  }

  protected shouldSurvive(neighbors: number): boolean {
    return neighbors === 2 || neighbors === 3;
  }

  protected shouldBirth(neighbors: number): boolean {
    return neighbors === 3;
  }
}

/** Helper for tests — convert coordinates to evolution input. */
export function makeGameOfLifeInput(
  bounds: GridBounds,
  alive: ReadonlyArray<{ x: number; y: number }>,
  overrides: Partial<EssenceEvolutionInput> = {},
): EssenceEvolutionInput {
  const aliveIndices = new Set(
    alive.map(({ x, y }) => packIndex(x, y, bounds.width)),
  );

  const currentCycle = overrides.currentCycle ?? 1;

  return {
    ...overrides,
    bounds,
    aliveIndices,
    globalLivingIndices: overrides.globalLivingIndices ?? aliveIndices,
    currentCycle,
    weather:
      overrides.weather ??
      Object.freeze({
        cycle: currentCycle,
        windStrength: 0,
        degrees: 0,
      }),
  };
}

/** Helper for tests — unpack result indices to coordinates. */
export function unpackAliveCells(
  indices: ReadonlyArray<CellIndex>,
  width: number,
): Array<{ x: number; y: number }> {
  return indices.map((index) => ({
    x: index % width,
    y: Math.floor(index / width),
  }));
}

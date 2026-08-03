import type { CellIndex, GridBounds } from "../../../../core/types/grid";
import { packIndex } from "../../../../core/types/grid";
import {
  forEachMooreNeighborIndex,
  forEachMooreNeighborInSet,
} from "../../../../shared/grid/neighbors";
import type {
  Essence,
  EssenceEvolutionInput,
  EssenceEvolutionResult,
} from "./Essence";

export const DEFAULT_MUSHROOM_COLOR = 0x8b4513;
export const MUSHROOM_COLD_THRESHOLD_DEGREES = 25;
const PROPAGATION_INTERVAL = 10;
const WARM_PROPAGATION_NEIGHBOR_COUNT = 3;
const COLD_PROPAGATION_NEIGHBOR_COUNT = 4;
const ENEMY_GROUP_SIZE = 3;

function hasConnectedGroupInSet(
  startIndex: CellIndex,
  keySet: ReadonlySet<CellIndex>,
  bounds: GridBounds,
  minSize: number,
): boolean {
  const visited = new Set<CellIndex>();
  const queue: CellIndex[] = [startIndex];
  visited.add(startIndex);
  let componentSize = 0;

  while (queue.length > 0) {
    const current = queue.pop()!;
    componentSize++;

    if (componentSize >= minSize) {
      return true;
    }

    forEachMooreNeighborInSet(current, keySet, bounds, (neighborIndex) => {
      if (visited.has(neighborIndex)) {
        return;
      }

      visited.add(neighborIndex);
      queue.push(neighborIndex);
    });
  }

  return false;
}

function hasAnyConnectedGroupOfSize(
  indices: ReadonlySet<CellIndex>,
  bounds: GridBounds,
  minSize: number,
): boolean {
  if (indices.size < minSize) {
    return false;
  }

  for (const startIndex of indices) {
    if (hasConnectedGroupInSet(startIndex, indices, bounds, minSize)) {
      return true;
    }
  }

  return false;
}

function collectEnemyNeighbors(
  index: CellIndex,
  aliveIndices: ReadonlySet<CellIndex>,
  globalLivingIndices: ReadonlySet<CellIndex>,
  bounds: GridBounds,
  target: CellIndex[],
): void {
  target.length = 0;

  forEachMooreNeighborIndex(index, bounds, (neighborIndex) => {
    if (
      globalLivingIndices.has(neighborIndex) &&
      !aliveIndices.has(neighborIndex)
    ) {
      target.push(neighborIndex);
    }
  });
}

/** Propagation lente — naissance et mort tous les 10 cycles selon météo et voisinage. */
export class MushroomEssence implements Essence {
  readonly color: number;

  constructor(color: number = DEFAULT_MUSHROOM_COLOR) {
    this.color = color;
  }

  evolve(input: EssenceEvolutionInput): EssenceEvolutionResult {
    const { bounds, aliveIndices, currentCycle, globalLivingIndices } = input;
    const isCold = input.weather.degrees < MUSHROOM_COLD_THRESHOLD_DEGREES;

    if (currentCycle % PROPAGATION_INTERVAL !== 0) {
      return { aliveIndices: [...aliveIndices] };
    }

    const nextAlive: CellIndex[] = [];
    const enemyNeighborBuffer: CellIndex[] = [];
    const mushroomNeighborBuffer: CellIndex[] = [];

    for (const index of aliveIndices) {
      collectEnemyNeighbors(
        index,
        aliveIndices,
        globalLivingIndices,
        bounds,
        enemyNeighborBuffer,
      );

      const enemySet = new Set(enemyNeighborBuffer);
      const diesFromEnemies =
        enemyNeighborBuffer.length >= ENEMY_GROUP_SIZE &&
        hasAnyConnectedGroupOfSize(enemySet, bounds, ENEMY_GROUP_SIZE);

      mushroomNeighborBuffer.length = 0;
      forEachMooreNeighborInSet(
        index,
        aliveIndices,
        bounds,
        (neighborIndex) => {
          mushroomNeighborBuffer.push(neighborIndex);
        },
      );

      const coldNeighborCount = mushroomNeighborBuffer.length;
      const diesFromColdIsolation =
        isCold &&
        (coldNeighborCount === 1 || coldNeighborCount === 2) &&
        hasAnyConnectedGroupOfSize(
          new Set(mushroomNeighborBuffer),
          bounds,
          coldNeighborCount,
        );

      if (!diesFromEnemies && !diesFromColdIsolation) {
        nextAlive.push(index);
      }
    }

    const candidates = new Set<CellIndex>();

    for (const index of aliveIndices) {
      forEachMooreNeighborIndex(index, bounds, (neighborIndex) => {
        if (
          !aliveIndices.has(neighborIndex) &&
          !globalLivingIndices.has(neighborIndex)
        ) {
          candidates.add(neighborIndex);
        }
      });
    }

    const propagationNeighborCount = isCold
      ? COLD_PROPAGATION_NEIGHBOR_COUNT
      : WARM_PROPAGATION_NEIGHBOR_COUNT;

    for (const candidateIndex of candidates) {
      mushroomNeighborBuffer.length = 0;

      forEachMooreNeighborInSet(
        candidateIndex,
        aliveIndices,
        bounds,
        (neighborIndex) => {
          mushroomNeighborBuffer.push(neighborIndex);
        },
      );

      const shouldBirth =
        mushroomNeighborBuffer.length === propagationNeighborCount &&
        hasAnyConnectedGroupOfSize(
          new Set(mushroomNeighborBuffer),
          bounds,
          propagationNeighborCount,
        );

      if (shouldBirth) {
        nextAlive.push(candidateIndex);
      }
    }

    return { aliveIndices: nextAlive };
  }
}

/** Helper for tests — build input from coordinates. */
export function makeMushroomInput(
  bounds: GridBounds,
  alive: ReadonlyArray<{ x: number; y: number }>,
  other: ReadonlyArray<{ x: number; y: number }> = [],
  currentCycle = 50,
  degrees = MUSHROOM_COLD_THRESHOLD_DEGREES,
): EssenceEvolutionInput {
  const aliveIndices = new Set(
    alive.map(({ x, y }) => packIndex(x, y, bounds.width)),
  );
  const globalLivingIndices = new Set(aliveIndices);

  for (const { x, y } of other) {
    globalLivingIndices.add(packIndex(x, y, bounds.width));
  }

  return {
    bounds,
    aliveIndices,
    globalLivingIndices,
    currentCycle,
    weather: Object.freeze({
      cycle: currentCycle,
      windStrength: 0,
      degrees,
    }),
  };
}

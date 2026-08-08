import type { CellIndex, GridBounds } from "../../../../core/types/grid";
import { packIndex } from "../../../../core/types/grid";
import { createLifeLikeBehavior } from "../evolution/behaviors/LifeLikeBehavior";
import {
  Essence,
  type EssenceDefinition,
  type EssenceEvolutionInput,
} from "./Essence";

export const DEFAULT_GAME_OF_LIFE_COLOR = 0x00ff88;

const CONWAY_EVOLUTION = createLifeLikeBehavior("conway-b3-s23", {
  birthNeighborCounts: new Set([3]),
  survivalNeighborCounts: new Set([2, 3]),
});

/** Configuration Conway B3/S23 composée avec le comportement LifeLike. */
export class GameOfLifeEssence extends Essence {
  constructor(
    color: number = DEFAULT_GAME_OF_LIFE_COLOR,
    overrides: Partial<EssenceDefinition> = {},
  ) {
    super({
      id: "game-of-life",
      name: "Conway",
      color,
      evolutionBehaviors: [CONWAY_EVOLUTION],
      ...overrides,
    });
  }
}

export function makeGameOfLifeInput(
  bounds: GridBounds,
  alive: ReadonlyArray<{ x: number; y: number }>,
  overrides: Partial<EssenceEvolutionInput> = {},
): EssenceEvolutionInput {
  const aliveIndices = new Set(
    alive.map(({ x, y }) => packIndex(x, y, bounds.width)),
  );

  return {
    ...overrides,
    bounds,
    aliveIndices,
    essenceIndices: overrides.essenceIndices ?? aliveIndices,
    globalLivingIndices: overrides.globalLivingIndices ?? aliveIndices,
    currentCycle: overrides.currentCycle ?? 1,
  };
}

export function unpackAliveCells(
  indices: ReadonlyArray<CellIndex>,
  width: number,
): Array<{ x: number; y: number }> {
  return indices.map((index) => ({
    x: index % width,
    y: Math.floor(index / width),
  }));
}

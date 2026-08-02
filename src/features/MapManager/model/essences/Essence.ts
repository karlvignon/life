import type { CellIndex, GridBounds } from "../../../../core/types/grid";

export interface EssenceEvolutionInput {
  bounds: GridBounds;
  /** Cell indices alive in this essence group. */
  aliveIndices: ReadonlySet<CellIndex>;
  /** Numéro du cycle courant (1-based, incrémenté à chaque step). */
  currentCycle: number;
  /** All living cell indices on the grid (all essences). */
  globalLivingIndices: ReadonlySet<CellIndex>;
}

export interface EssenceEvolutionResult {
  aliveIndices: ReadonlyArray<CellIndex>;
}

/** Contrat pur d'évolution d'un groupe de cellules dans les bornes de la grille. */
export interface Essence {
  readonly color: number;
  evolve(input: EssenceEvolutionInput): EssenceEvolutionResult;
}

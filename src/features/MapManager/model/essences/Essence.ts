import type { CellOffset } from "../../../../core/types/grid";

export interface EssenceEvolutionInput {
  gridWidth: number;
  gridHeight: number;
  aliveCells: ReadonlyArray<CellOffset>;
  /** Numéro du cycle courant (1-based, incrémenté à chaque step). */
  currentCycle: number;
  /** Positions vivantes appartenant à d'autres essences. */
  otherEssenceCells: ReadonlyArray<CellOffset>;
}

export interface EssenceEvolutionResult {
  aliveCells: ReadonlyArray<CellOffset>;
}

/** Contrat pur d'évolution d'un groupe de cellules dans les bornes de la grille. */
export interface Essence {
  readonly color: number;
  evolve(input: EssenceEvolutionInput): EssenceEvolutionResult;
}

import type { CellOffset } from "./types";

export interface EssenceEvolutionInput {
  gridWidth: number;
  gridHeight: number;
  aliveCells: ReadonlyArray<CellOffset>;
}

export interface EssenceEvolutionResult {
  aliveCells: ReadonlyArray<CellOffset>;
}

/** Contrat pur d'évolution d'un groupe de cellules dans les bornes de la grille. */
export interface Essence {
  readonly color: number;
  evolve(input: EssenceEvolutionInput): EssenceEvolutionResult;
}

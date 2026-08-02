import type { CellIndex, GridBounds } from "../../../../core/types/grid";
import type { Essence } from "../essences/Essence";

export interface LivingCellEntry {
  readonly index: CellIndex;
  readonly essence: Essence;
}

export interface EssenceGeneration {
  readonly essence: Essence;
  readonly inputIndices: ReadonlySet<CellIndex>;
  readonly outputIndices: ReadonlyArray<CellIndex>;
  readonly outputSet: ReadonlySet<CellIndex>;
}

export interface EvolutionInput {
  readonly bounds: GridBounds;
  readonly living: ReadonlyArray<LivingCellEntry>;
  readonly currentCycle: number;
  readonly essenceOrder: ReadonlyArray<Essence>;
}

export interface EvolutionOutput {
  readonly nextLiving: ReadonlyMap<CellIndex, Essence>;
}

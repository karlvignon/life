import type { CellIndex, GridBounds } from "../../../../core/types/grid";
import type { Essence, EssenceBirth } from "../essences/Essence";

export interface LivingCellReference {
  readonly index: CellIndex;
  readonly essence: Essence;
}

export interface LivingCellEntry extends LivingCellReference {
  readonly reproducibility: number;
}

export interface EssenceGeneration {
  readonly essence: Essence;
  readonly inputIndices: ReadonlySet<CellIndex>;
  readonly outputIndices: ReadonlyArray<CellIndex>;
  readonly outputSet: ReadonlySet<CellIndex>;
  readonly births?: ReadonlyArray<EssenceBirth>;
}

export interface EvolutionInput {
  readonly bounds: GridBounds;
  readonly living: ReadonlyArray<LivingCellEntry>;
  readonly currentCycle: number;
  readonly essenceOrder: ReadonlyArray<Essence>;
}

export interface EvolutionOutput {
  readonly nextLiving: ReadonlyMap<CellIndex, Essence>;
  readonly reproductionCosts: ReadonlyMap<CellIndex, number>;
  readonly newbornReproducibility: ReadonlyMap<CellIndex, number>;
}

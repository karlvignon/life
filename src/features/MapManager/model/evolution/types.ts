import type { CellIndex, GridBounds } from "../../../../core/types/grid";
import type { PlayerId } from "../../../../core/types/player";
import type { TeamId } from "../../../../core/types/team";
import type { Essence, EssenceBirth } from "../essences/Essence";

export interface LivingCellReference {
  readonly index: CellIndex;
  readonly essence: Essence;
}

export interface LivingCellEntry extends LivingCellReference {
  readonly reproducibility: number;
  readonly playerId: PlayerId;
  readonly teamId: TeamId;
}

export interface EssenceGeneration {
  readonly essence: Essence;
  readonly teamId: TeamId;
  readonly inputIndices: ReadonlySet<CellIndex>;
  readonly outputIndices: ReadonlyArray<CellIndex>;
  readonly outputSet: ReadonlySet<CellIndex>;
  readonly births?: ReadonlyArray<EssenceBirth>;
}

export interface AcceptedBirth {
  readonly index: CellIndex;
  readonly essence: Essence;
  readonly teamId: TeamId;
  readonly playerId: PlayerId;
  readonly parentIndices: ReadonlyArray<CellIndex>;
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
  readonly newbornPlayerIds: ReadonlyMap<CellIndex, PlayerId>;
}

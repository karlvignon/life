import type { CellIndex } from "../../../../core/types/grid";
import type { Essence } from "../essences/Essence";
import type { EssenceGeneration, LivingCellEntry } from "./types";

export type BirthAcceptance = (
  generation: EssenceGeneration,
  birthIndex: CellIndex,
) => boolean;

export function mergeGenerations(
  living: ReadonlyArray<LivingCellEntry>,
  generations: ReadonlyArray<EssenceGeneration>,
  essenceOrder: ReadonlyArray<Essence>,
  acceptBirth: BirthAcceptance = () => true,
): Map<CellIndex, Essence> {
  const merged = new Map<CellIndex, Essence>();
  const genByEssence = new Map(generations.map((g) => [g.essence, g]));

  for (const { index, essence } of living) {
    const generation = genByEssence.get(essence);
    if (generation?.outputSet.has(index)) {
      merged.set(index, essence);
    }
  }

  for (const essence of essenceOrder) {
    const generation = genByEssence.get(essence);
    if (!generation) {
      continue;
    }

    for (const index of generation.outputIndices) {
      if (merged.has(index)) {
        continue;
      }

      if (generation.inputIndices.has(index)) {
        continue;
      }

      if (!acceptBirth(generation, index)) {
        continue;
      }

      merged.set(index, essence);
    }
  }

  return merged;
}

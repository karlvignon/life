import type { CellIndex } from "../../../../core/types/grid";
import type { Essence } from "../essences/Essence";
import type {
  AcceptedBirth,
  EssenceGeneration,
  LivingCellEntry,
} from "./types";

/** Applique les survivants puis les naissances déjà arbitrées. */
export function mergeGenerations(
  living: ReadonlyArray<LivingCellEntry>,
  generations: ReadonlyArray<EssenceGeneration>,
  acceptedBirths: ReadonlyMap<CellIndex, AcceptedBirth>,
): Map<CellIndex, Essence> {
  const merged = new Map<CellIndex, Essence>();
  const generationsByEssenceAndTeam = groupGenerations(generations);

  for (const { index, essence, teamId } of living) {
    const generation = generationsByEssenceAndTeam.get(essence)?.get(teamId);
    if (generation?.outputSet.has(index)) {
      merged.set(index, essence);
    }
  }

  for (const [index, birth] of acceptedBirths) {
    if (!merged.has(index)) {
      merged.set(index, birth.essence);
    }
  }

  return merged;
}

function groupGenerations(
  generations: ReadonlyArray<EssenceGeneration>,
): Map<Essence, Map<string, EssenceGeneration>> {
  const grouped = new Map<Essence, Map<string, EssenceGeneration>>();

  for (const generation of generations) {
    const byTeam = grouped.get(generation.essence) ?? new Map();
    byTeam.set(generation.teamId, generation);
    grouped.set(generation.essence, byTeam);
  }

  return grouped;
}

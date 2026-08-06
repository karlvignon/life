import type { CellIndex } from "../../../../core/types/grid";
import type { PlayerId } from "../../../../core/types/player";
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
  const generationsByEssence = groupGenerationsByEssence(generations);
  const contestedBirths = collectContestedBirths(generations);

  for (const { index, essence, playerId } of living) {
    const generation = generationsByEssence
      .get(essence)
      ?.find((candidate) => candidate.playerId === playerId);
    if (generation?.outputSet.has(index)) {
      merged.set(index, essence);
    }
  }

  for (const essence of essenceOrder) {
    const essenceGenerations = generationsByEssence.get(essence) ?? [];

    for (const generation of essenceGenerations) {
      for (const index of generation.outputIndices) {
        if (merged.has(index)) {
          continue;
        }

        if (generation.inputIndices.has(index)) {
          continue;
        }

        if (contestedBirths.has(index)) {
          continue;
        }

        if (!acceptBirth(generation, index)) {
          continue;
        }

        merged.set(index, essence);
      }
    }
  }

  return merged;
}

function groupGenerationsByEssence(
  generations: ReadonlyArray<EssenceGeneration>,
): Map<Essence, EssenceGeneration[]> {
  const grouped = new Map<Essence, EssenceGeneration[]>();

  for (const generation of generations) {
    const group = grouped.get(generation.essence) ?? [];
    group.push(generation);
    grouped.set(generation.essence, group);
  }

  return grouped;
}

function collectContestedBirths(
  generations: ReadonlyArray<EssenceGeneration>,
): ReadonlySet<CellIndex> {
  const ownersByIndex = new Map<CellIndex, Set<PlayerId>>();

  for (const generation of generations) {
    for (const index of generation.outputIndices) {
      if (generation.inputIndices.has(index)) {
        continue;
      }

      const owners = ownersByIndex.get(index) ?? new Set<PlayerId>();
      owners.add(generation.playerId);
      ownersByIndex.set(index, owners);
    }
  }

  return new Set(
    [...ownersByIndex]
      .filter(([, owners]) => owners.size > 1)
      .map(([index]) => index),
  );
}

import type { CellIndex } from "../../../../core/types/grid";
import type { Essence } from "../essences/Essence";
import { mergeGenerations } from "./GenerationMerger";
import type {
  EssenceGeneration,
  EvolutionInput,
  EvolutionOutput,
  LivingCellEntry,
} from "./types";

export function computeNextGeneration(input: EvolutionInput): EvolutionOutput {
  const globalLiving = new Set<CellIndex>(
    input.living.map((cell) => cell.index),
  );
  const groups = groupByEssence(input.living, input.essenceOrder);
  const generations: EssenceGeneration[] = [];

  for (const essence of input.essenceOrder) {
    const entries = groups.get(essence);
    if (!entries?.length) {
      continue;
    }

    const aliveIndices = new Set<CellIndex>(
      entries.map((entry) => entry.index),
    );
    const result = essence.evolve({
      bounds: input.bounds,
      aliveIndices,
      globalLivingIndices: globalLiving,
      currentCycle: input.currentCycle,
    });

    generations.push({
      essence,
      inputIndices: aliveIndices,
      outputIndices: result.aliveIndices,
      outputSet: new Set(result.aliveIndices),
      births: result.births ?? [],
    });
  }

  const remainingReproducibility = new Map(
    input.living.map(({ index, reproducibility }) => [index, reproducibility]),
  );
  const reproductionCosts = new Map<CellIndex, number>();
  const acceptedBirths = new Map<CellIndex, ReadonlyArray<CellIndex>>();
  const birthsByGeneration = new Map(
    generations.map((generation) => [
      generation,
      new Map((generation.births ?? []).map((birth) => [birth.index, birth])),
    ]),
  );

  const nextLiving = mergeGenerations(
    input.living,
    generations,
    input.essenceOrder,
    (generation, birthIndex) => {
      const birth = birthsByGeneration.get(generation)?.get(birthIndex);
      if (!birth) {
        return true;
      }

      const parentIndices = [...new Set(birth.parentIndices)];
      const reproductionCost = generation.essence.getReproductionCost();
      const parentsCanPay = parentIndices.every(
        (parentIndex) =>
          (remainingReproducibility.get(parentIndex) ?? -Infinity) >=
          reproductionCost,
      );
      if (!parentsCanPay) {
        return false;
      }

      for (const parentIndex of parentIndices) {
        remainingReproducibility.set(
          parentIndex,
          remainingReproducibility.get(parentIndex)! - reproductionCost,
        );
        reproductionCosts.set(
          parentIndex,
          (reproductionCosts.get(parentIndex) ?? 0) + reproductionCost,
        );
      }
      acceptedBirths.set(birthIndex, parentIndices);
      return true;
    },
  );
  const newbornReproducibility = collectNewbornReproducibility(
    acceptedBirths,
    remainingReproducibility,
  );

  return { nextLiving, reproductionCosts, newbornReproducibility };
}

function collectNewbornReproducibility(
  acceptedBirths: ReadonlyMap<CellIndex, ReadonlyArray<CellIndex>>,
  remainingReproducibility: ReadonlyMap<CellIndex, number>,
): Map<CellIndex, number> {
  const inheritedScores = new Map<CellIndex, number>();

  for (const [birthIndex, parentIndices] of acceptedBirths) {
    if (parentIndices.length === 0) {
      continue;
    }

    inheritedScores.set(
      birthIndex,
      Math.min(
        ...parentIndices.map((parentIndex) =>
          remainingReproducibility.get(parentIndex)!,
        ),
      ),
    );
  }

  return inheritedScores;
}

function groupByEssence(
  living: ReadonlyArray<LivingCellEntry>,
  essenceOrder: ReadonlyArray<Essence>,
): Map<Essence, LivingCellEntry[]> {
  const groups = new Map<Essence, LivingCellEntry[]>();

  for (const essence of essenceOrder) {
    groups.set(essence, []);
  }

  for (const entry of living) {
    const group = groups.get(entry.essence);
    if (group) {
      group.push(entry);
    } else {
      groups.set(entry.essence, [entry]);
    }
  }

  return groups;
}

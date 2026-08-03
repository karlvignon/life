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
    });
  }

  const nextLiving = mergeGenerations(
    input.living,
    generations,
    input.essenceOrder,
  );

  return { nextLiving };
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

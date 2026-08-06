import type { CellIndex } from "../../../../core/types/grid";
import type { PlayerId } from "../../../../core/types/player";
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
  const groups = groupByEssenceAndPlayer(input.living, input.essenceOrder);
  const generations: EssenceGeneration[] = [];

  for (const { essence, playerId, entries } of groups) {
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
      playerId,
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
  const acceptedBirths = new Map<
    CellIndex,
    { parentIndices: ReadonlyArray<CellIndex>; playerId: PlayerId }
  >();
  const ownersByIndex = new Map(
    input.living.map(({ index, playerId }) => [index, playerId]),
  );
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
      const hasForeignParent = parentIndices.some(
        (parentIndex) => ownersByIndex.get(parentIndex) !== generation.playerId,
      );
      if (parentIndices.length === 0 || hasForeignParent) {
        return false;
      }
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
      acceptedBirths.set(birthIndex, {
        parentIndices,
        playerId: generation.playerId,
      });
      return true;
    },
  );
  const newbornReproducibility = collectNewbornReproducibility(
    acceptedBirths,
    remainingReproducibility,
  );
  const newbornPlayerIds = new Map(
    [...acceptedBirths].map(([index, birth]) => [index, birth.playerId]),
  );

  return {
    nextLiving,
    reproductionCosts,
    newbornReproducibility,
    newbornPlayerIds,
  };
}

function collectNewbornReproducibility(
  acceptedBirths: ReadonlyMap<
    CellIndex,
    { parentIndices: ReadonlyArray<CellIndex> }
  >,
  remainingReproducibility: ReadonlyMap<CellIndex, number>,
): Map<CellIndex, number> {
  const inheritedScores = new Map<CellIndex, number>();

  for (const [birthIndex, { parentIndices }] of acceptedBirths) {
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

interface EvolutionGroup {
  readonly essence: Essence;
  readonly playerId: PlayerId;
  readonly entries: ReadonlyArray<LivingCellEntry>;
}

function groupByEssenceAndPlayer(
  living: ReadonlyArray<LivingCellEntry>,
  essenceOrder: ReadonlyArray<Essence>,
): EvolutionGroup[] {
  const groups = new Map<Essence, Map<PlayerId, LivingCellEntry[]>>();

  for (const essence of essenceOrder) {
    groups.set(essence, new Map());
  }

  for (const entry of living) {
    const groupsByPlayer = groups.get(entry.essence) ?? new Map();
    const playerGroup = groupsByPlayer.get(entry.playerId) ?? [];
    playerGroup.push(entry);
    groupsByPlayer.set(entry.playerId, playerGroup);
    groups.set(entry.essence, groupsByPlayer);
  }

  return [...groups].flatMap(([essence, groupsByPlayer]) =>
    [...groupsByPlayer].map(([playerId, entries]) => ({
      essence,
      playerId,
      entries,
    })),
  );
}

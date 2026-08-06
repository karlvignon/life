import type { CellIndex } from "../../../../../core/types/grid";
import {
  countMooreNeighborsInSet,
  forEachMooreNeighborIndex,
} from "../../../../../shared/grid/neighbors";
import type {
  EssenceEvolutionInput,
  EvolutionBehavior,
  EvolutionProposal,
} from "../../essences/Essence";

export interface LifeLikeRules {
  readonly birthNeighborCounts: ReadonlySet<number>;
  readonly survivalNeighborCounts: ReadonlySet<number>;
}

export function createLifeLikeBehavior(
  id: string,
  rules: LifeLikeRules,
): EvolutionBehavior {
  const birthCounts = new Set(rules.birthNeighborCounts);
  const survivalCounts = new Set(rules.survivalNeighborCounts);

  return Object.freeze({
    id,
    evaluate(input: EssenceEvolutionInput): EvolutionProposal {
      const { bounds, aliveIndices } = input;
      const candidates = new Set<CellIndex>();
      for (const index of aliveIndices) {
        candidates.add(index);
        forEachMooreNeighborIndex(index, bounds, (neighborIndex) => {
          candidates.add(neighborIndex);
        });
      }

      const births = [];
      const deaths: CellIndex[] = [];
      for (const index of candidates) {
        const neighborCount = countMooreNeighborsInSet(
          index,
          aliveIndices,
          bounds,
        );
        if (aliveIndices.has(index)) {
          if (!survivalCounts.has(neighborCount)) {
            deaths.push(index);
          }
          continue;
        }

        if (birthCounts.has(neighborCount)) {
          const parentIndices: CellIndex[] = [];
          forEachMooreNeighborIndex(index, bounds, (neighborIndex) => {
            if (aliveIndices.has(neighborIndex)) {
              parentIndices.push(neighborIndex);
            }
          });
          births.push({ index, parentIndices });
        }
      }

      return { births, deaths };
    },
  });
}

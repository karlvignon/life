import {
  isInBounds,
  packIndex,
  unpackIndex,
  type CellIndex,
  type CellOffset,
} from "../../../../../core/types/grid";
import type {
  EssenceEvolutionInput,
  EvolutionBehavior,
  EvolutionProposal,
} from "../../essences/Essence";

export type BirthPattern = ReadonlyArray<Readonly<CellOffset>>;

export function createPatternBirthBehavior(
  id: string,
  pattern: BirthPattern,
): EvolutionBehavior {
  const birthPattern = freezeBirthPattern(pattern);

  return Object.freeze({
    id,
    evaluate(input: EssenceEvolutionInput): EvolutionProposal {
      const { aliveIndices, bounds, globalLivingIndices } = input;
      const candidates = new Set<CellIndex>();

      for (const aliveIndex of aliveIndices) {
        const aliveCell = unpackIndex(aliveIndex, bounds.width);

        for (const offset of birthPattern) {
          const candidateX = aliveCell.x - offset.x;
          const candidateY = aliveCell.y - offset.y;
          if (isInBounds(candidateX, candidateY, bounds)) {
            candidates.add(packIndex(candidateX, candidateY, bounds.width));
          }
        }
      }

      const births = [];
      for (const candidateIndex of candidates) {
        if (globalLivingIndices.has(candidateIndex)) {
          continue;
        }

        const candidate = unpackIndex(candidateIndex, bounds.width);
        const parentIndices: CellIndex[] = [];
        const patternIsComplete = birthPattern.every((offset) => {
          const parentX = candidate.x + offset.x;
          const parentY = candidate.y + offset.y;
          if (!isInBounds(parentX, parentY, bounds)) {
            return false;
          }
          const parentIndex = packIndex(parentX, parentY, bounds.width);
          parentIndices.push(parentIndex);
          return aliveIndices.has(parentIndex);
        });
        if (patternIsComplete) {
          births.push({ index: candidateIndex, parentIndices });
        }
      }

      return { births };
    },
  });
}

export function freezeBirthPattern(pattern: BirthPattern): BirthPattern {
  if (pattern.length === 0) {
    throw new RangeError("birth pattern must contain at least one offset");
  }

  const keys = new Set<string>();
  return Object.freeze(
    pattern.map(({ x, y }) => {
      if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) {
        throw new RangeError("birth pattern offsets must be safe integers");
      }
      if (x === 0 && y === 0) {
        throw new RangeError("birth pattern cannot contain its birth center");
      }

      const key = `${x},${y}`;
      if (keys.has(key)) {
        throw new RangeError("birth pattern offsets must be unique");
      }
      keys.add(key);
      return Object.freeze({ x, y });
    }),
  );
}

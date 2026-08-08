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
import type { PlaceableRotation } from "../../Placeable";

export type BirthPattern = ReadonlyArray<Readonly<CellOffset>>;
export type PatternParentScope = "family" | "essence";

export function createPatternBirthBehavior(
  id: string,
  pattern: BirthPattern,
  parentScope: PatternParentScope = "family",
): EvolutionBehavior {
  const birthPattern = freezeBirthPattern(pattern);

  return Object.freeze({
    id,
    evaluate(input: EssenceEvolutionInput): EvolutionProposal {
      const { aliveIndices, essenceIndices, bounds, globalLivingIndices } =
        input;
      const parentIndicesForPattern =
        parentScope === "essence" ? essenceIndices : aliveIndices;
      const candidateRotations = new Map<CellIndex, Set<PlaceableRotation>>();

      for (const aliveIndex of parentIndicesForPattern) {
        const aliveCell = unpackIndex(aliveIndex, bounds.width);
        const rotation = input.rotationsByIndex?.get(aliveIndex) ?? 0;

        for (const offset of birthPattern) {
          const rotatedOffset = rotateOffset(offset, rotation);
          const candidateX = aliveCell.x - rotatedOffset.x;
          const candidateY = aliveCell.y - rotatedOffset.y;
          if (isInBounds(candidateX, candidateY, bounds)) {
            const candidateIndex = packIndex(
              candidateX,
              candidateY,
              bounds.width,
            );
            const rotations =
              candidateRotations.get(candidateIndex) ?? new Set();
            rotations.add(rotation);
            candidateRotations.set(candidateIndex, rotations);
          }
        }
      }

      const births = [];
      for (const [candidateIndex, rotations] of candidateRotations) {
        if (globalLivingIndices.has(candidateIndex)) {
          continue;
        }

        const candidate = unpackIndex(candidateIndex, bounds.width);
        for (const rotation of rotations) {
          const parentIndices: CellIndex[] = [];
          const patternIsComplete = birthPattern.every((offset) => {
            const rotatedOffset = rotateOffset(offset, rotation);
            const parentX = candidate.x + rotatedOffset.x;
            const parentY = candidate.y + rotatedOffset.y;
            if (!isInBounds(parentX, parentY, bounds)) {
              return false;
            }
            const parentIndex = packIndex(parentX, parentY, bounds.width);
            parentIndices.push(parentIndex);
            return (
              parentIndicesForPattern.has(parentIndex) &&
              (input.rotationsByIndex?.get(parentIndex) ?? 0) === rotation
            );
          });
          if (patternIsComplete) {
            births.push({ index: candidateIndex, parentIndices, rotation });
            break;
          }
        }
      }

      return { births };
    },
  });
}

function rotateOffset(
  offset: CellOffset,
  rotation: PlaceableRotation,
): CellOffset {
  switch (rotation) {
    case 90:
      return { x: -offset.y, y: offset.x };
    case 180:
      return { x: -offset.x, y: -offset.y };
    case 270:
      return { x: offset.y, y: -offset.x };
    default:
      return offset;
  }
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

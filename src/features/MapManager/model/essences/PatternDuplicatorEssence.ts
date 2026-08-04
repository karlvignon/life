import {
  isInBounds,
  packIndex,
  unpackIndex,
  type CellIndex,
  type CellOffset,
} from "../../../../core/types/grid";
import {
  Essence,
  type EssenceEvolutionInput,
  type EssenceEvolutionResult,
} from "./Essence";

export type BirthPattern = ReadonlyArray<Readonly<CellOffset>>;

/**
 * Essence stable qui crée une naissance au centre d'un motif complet.
 * Les offsets sont relatifs à la cellule à faire naître.
 */
export abstract class PatternDuplicatorEssence extends Essence {
  private readonly birthPattern: BirthPattern;

  protected constructor(
    readonly color: number,
    birthPattern: BirthPattern,
  ) {
    super();
    this.birthPattern = validateAndFreezePattern(birthPattern);
  }

  getBirthPattern(): BirthPattern {
    return this.birthPattern;
  }

  evolve(input: EssenceEvolutionInput): EssenceEvolutionResult {
    const { aliveIndices, bounds, globalLivingIndices } = input;
    const candidates = new Set<CellIndex>();

    for (const aliveIndex of aliveIndices) {
      const aliveCell = unpackIndex(aliveIndex, bounds.width);

      for (const offset of this.birthPattern) {
        const candidateX = aliveCell.x - offset.x;
        const candidateY = aliveCell.y - offset.y;

        if (isInBounds(candidateX, candidateY, bounds)) {
          candidates.add(packIndex(candidateX, candidateY, bounds.width));
        }
      }
    }

    const nextAlive = [...aliveIndices];

    for (const candidateIndex of candidates) {
      if (globalLivingIndices.has(candidateIndex)) {
        continue;
      }

      const candidate = unpackIndex(candidateIndex, bounds.width);
      const patternIsComplete = this.birthPattern.every((offset) => {
        const patternX = candidate.x + offset.x;
        const patternY = candidate.y + offset.y;

        return (
          isInBounds(patternX, patternY, bounds) &&
          aliveIndices.has(packIndex(patternX, patternY, bounds.width))
        );
      });

      if (patternIsComplete) {
        nextAlive.push(candidateIndex);
      }
    }

    return { aliveIndices: nextAlive };
  }
}

function validateAndFreezePattern(pattern: BirthPattern): BirthPattern {
  if (pattern.length === 0) {
    throw new RangeError("birth pattern must contain at least one offset");
  }

  const keys = new Set<string>();
  const frozenPattern = pattern.map(({ x, y }) => {
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
  });

  return Object.freeze(frozenPattern);
}

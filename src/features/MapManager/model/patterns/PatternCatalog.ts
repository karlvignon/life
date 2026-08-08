import type { CardPatternId } from "../../../../core/types/cards";
import { EncodedPattern } from "./EncodedPattern";
import type { Pattern } from "./Pattern";
import {
  parsePatternEncoding,
  type ParsedPatternEncoding,
  type PatternEncoding,
} from "./PatternEncoding";

export interface EncodedPatternDefinition {
  readonly id: CardPatternId;
  readonly encoding: PatternEncoding;
}

export class PatternCatalog {
  private readonly definitions: ReadonlyMap<
    CardPatternId,
    ParsedPatternEncoding
  >;

  constructor(entries: ReadonlyArray<EncodedPatternDefinition>) {
    const definitions = new Map<CardPatternId, ParsedPatternEncoding>();
    for (const { id, encoding } of entries) {
      if (!id.trim() || definitions.has(id)) {
        throw new RangeError(
          "pattern catalog ids must be unique and non-empty",
        );
      }
      definitions.set(id, parsePatternEncoding(encoding));
    }
    this.definitions = definitions;
  }

  create(id: CardPatternId): Pattern {
    const definition = this.definitions.get(id);
    if (!definition) {
      throw new Error(`Unknown pattern: ${id}`);
    }
    return new EncodedPattern(id, definition);
  }

  has(id: CardPatternId): boolean {
    return this.definitions.has(id);
  }
}

export const patternCatalog = new PatternCatalog([
  { id: "start", encoding: "x=1;y=1;cells=1" },
  {
    id: "genesis",
    encoding: "x=6;y=5;cells=011111100001000001100010001000",
  },
  { id: "glider", encoding: "x=3;y=3;cells=010001111" },
  { id: "lwss", encoding: "x=4;y=4;cells=1011011100000111" },
  { id: "mwss", encoding: "x=5;y=5;cells=1011101000100110110010000" },
  { id: "blinker", encoding: "x=3;y=1;cells=111" },
  { id: "toad", encoding: "x=4;y=2;cells=01111110" },
  {
    id: "replicator",
    encoding: "x=5;y=5;cells=0011101001100011001011100",
  },
  { id: "cell", encoding: "x=1;y=1;cells=1" },
  { id: "vitality-mushroom", encoding: "x=1;y=1;cells=1" },
  { id: "horizontal-line", encoding: "x=3;y=1;cells=111" },
  { id: "five-cell-cross", encoding: "x=3;y=3;cells=010111010" },
  { id: "mushroom-birth", encoding: "x=3;y=3;cells=010101010" },
  { id: "mushroom-sprout", encoding: "x=3;y=3;cells=000010010" },
  { id: "flora-birth", encoding: "x=3;y=3;cells=111101111" },
  { id: "tree-birth", encoding: "x=3;y=3;cells=101000101" },
]);

export function createPattern(patternId: CardPatternId): Pattern {
  return patternCatalog.create(patternId);
}

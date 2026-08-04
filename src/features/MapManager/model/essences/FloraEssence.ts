import {
  PatternDuplicatorEssence,
  type BirthPattern,
} from "./PatternDuplicatorEssence";

export const DEFAULT_FLORA_COLOR = 0xec4899;

/** Anneau de huit fleurs autour du centre de naissance. */
export const FLORA_BIRTH_PATTERN: BirthPattern = Object.freeze([
  Object.freeze({ x: -1, y: -1 }),
  Object.freeze({ x: 0, y: -1 }),
  Object.freeze({ x: 1, y: -1 }),
  Object.freeze({ x: -1, y: 0 }),
  Object.freeze({ x: 1, y: 0 }),
  Object.freeze({ x: -1, y: 1 }),
  Object.freeze({ x: 0, y: 1 }),
  Object.freeze({ x: 1, y: 1 }),
]);

export class FloraEssence extends PatternDuplicatorEssence {
  readonly id = "flora";
  readonly name: string = "Flora";

  constructor(color: number = DEFAULT_FLORA_COLOR) {
    super(color, FLORA_BIRTH_PATTERN);
  }
}

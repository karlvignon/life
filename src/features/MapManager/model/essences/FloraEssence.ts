import { createPatternBirthBehavior } from "../evolution/behaviors/PatternBirthBehavior";
import { Essence } from "./Essence";
import type { BirthPattern } from "../evolution/behaviors/PatternBirthBehavior";

export const DEFAULT_FLORA_COLOR = 0xec4899;

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

const FLORA_EVOLUTION = createPatternBirthBehavior(
  "flora-ring-birth",
  FLORA_BIRTH_PATTERN,
);

export class FloraEssence extends Essence {
  constructor(color: number = DEFAULT_FLORA_COLOR) {
    super({
      id: "flora",
      name: "Flora",
      color,
      evolutionBehaviors: [FLORA_EVOLUTION],
    });
  }

  getBirthPattern(): BirthPattern {
    return FLORA_BIRTH_PATTERN;
  }
}

import {
  createPatternBirthBehavior,
  type BirthPattern,
} from "../evolution/behaviors/PatternBirthBehavior";
import { Essence } from "./Essence";
import {
  DEFAULT_MUSHROOM_COLOR,
  MUSHROOM_BIRTH_PATTERN,
  MUSHROOM_COLD_WEATHER_BEHAVIOR,
} from "./MushroomEssence";

export const MUSHROOM_SPROUT_BIRTH_PATTERN: BirthPattern = Object.freeze([
  Object.freeze({ x: 0, y: 1 }),
  Object.freeze({ x: 0, y: 2 }),
]);

const PARENT_MUSHROOM_EVOLUTION = createPatternBirthBehavior(
  "mushroom-cross-birth",
  MUSHROOM_BIRTH_PATTERN,
);
const SPROUT_EVOLUTION = createPatternBirthBehavior(
  "mushroom-sprout-birth",
  MUSHROOM_SPROUT_BIRTH_PATTERN,
  "essence",
);

/** Variante composée : météo Mushroom + deux comportements de naissance. */
export class MushroomSproutEssence extends Essence {
  constructor(color: number = DEFAULT_MUSHROOM_COLOR) {
    super({
      id: "mushroom-sprout",
      evolutionFamilyId: "mushroom",
      evolutionPriority: 1,
      name: "Mushroom sprout",
      color,
      initialProperties: {
        life: 100,
        maximumLife: 100,
        reproducibility: 7,
      },
      evolutionBehaviors: [PARENT_MUSHROOM_EVOLUTION, SPROUT_EVOLUTION],
      weatherBehaviors: [MUSHROOM_COLD_WEATHER_BEHAVIOR],
    });
  }

  getBirthPattern(): BirthPattern {
    return MUSHROOM_BIRTH_PATTERN;
  }

  getSproutBirthPattern(): BirthPattern {
    return MUSHROOM_SPROUT_BIRTH_PATTERN;
  }
}

import type { GridBounds } from "../../../../core/types/grid";
import type { WeatherSnapshot } from "../../../../core/types/weather";
import { packIndex } from "../../../../core/types/grid";
import {
  createPatternBirthBehavior,
  type BirthPattern,
} from "../evolution/behaviors/PatternBirthBehavior";
import {
  Essence,
  type EssenceEvolutionInput,
  type WeatherBehavior,
} from "./Essence";

export const DEFAULT_MUSHROOM_COLOR = 0x8b4513;
export const MUSHROOM_COLD_THRESHOLD_DEGREES = 25;
export const MUSHROOM_COLD_LIFE_LOSS = 10;
export const MUSHROOM_WEATHER_REPERCUSSION_INTERVAL = 10;

export const MUSHROOM_BIRTH_PATTERN: BirthPattern = Object.freeze([
  Object.freeze({ x: 0, y: -1 }),
  Object.freeze({ x: -1, y: 0 }),
  Object.freeze({ x: 1, y: 0 }),
  Object.freeze({ x: 0, y: 1 }),
]);

export const MUSHROOM_COLD_WEATHER_BEHAVIOR: WeatherBehavior = Object.freeze({
  id: "mushroom-cold-damage",
  evaluate(weather: Readonly<WeatherSnapshot>) {
    const suffersFromCold =
      weather.degrees < MUSHROOM_COLD_THRESHOLD_DEGREES &&
      weather.cycle % MUSHROOM_WEATHER_REPERCUSSION_INTERVAL === 0;
    return { life: suffersFromCold ? -MUSHROOM_COLD_LIFE_LOSS : 0 };
  },
});

const MUSHROOM_EVOLUTION = createPatternBirthBehavior(
  "mushroom-cross-birth",
  MUSHROOM_BIRTH_PATTERN,
);

export class MushroomEssence extends Essence {
  constructor(color: number = DEFAULT_MUSHROOM_COLOR) {
    super({
      id: "mushroom",
      name: "Mushroom",
      color,
      evolutionBehaviors: [MUSHROOM_EVOLUTION],
      weatherBehaviors: [MUSHROOM_COLD_WEATHER_BEHAVIOR],
    });
  }

  getBirthPattern(): BirthPattern {
    return MUSHROOM_BIRTH_PATTERN;
  }
}

export function makeMushroomInput(
  bounds: GridBounds,
  alive: ReadonlyArray<{ x: number; y: number }>,
  other: ReadonlyArray<{ x: number; y: number }> = [],
  currentCycle = 1,
): EssenceEvolutionInput {
  const aliveIndices = new Set(
    alive.map(({ x, y }) => packIndex(x, y, bounds.width)),
  );
  const globalLivingIndices = new Set(aliveIndices);

  for (const { x, y } of other) {
    globalLivingIndices.add(packIndex(x, y, bounds.width));
  }

  return { bounds, aliveIndices, globalLivingIndices, currentCycle };
}

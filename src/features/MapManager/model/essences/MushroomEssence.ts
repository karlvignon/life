import type { GridBounds } from "../../../../core/types/grid";
import type { WeatherSnapshot } from "../../../../core/types/weather";
import { packIndex } from "../../../../core/types/grid";
import type { EssenceEvolutionInput, EssencePropertiesDelta } from "./Essence";
import {
  PatternDuplicatorEssence,
  type BirthPattern,
} from "./PatternDuplicatorEssence";

export const DEFAULT_MUSHROOM_COLOR = 0x8b4513;
export const MUSHROOM_COLD_THRESHOLD_DEGREES = 25;
export const MUSHROOM_COLD_LIFE_LOSS = 10;
export const MUSHROOM_WEATHER_REPERCUSSION_INTERVAL = 10;

/**
 * Croix orthogonale autour du centre de naissance :
 *
 *     0 0 0 0 0
 *     0 0 1 0 0
 *     0 1 N 1 0
 *     0 0 1 0 0
 *     0 0 0 0 0
 */
export const MUSHROOM_BIRTH_PATTERN: BirthPattern = Object.freeze([
  Object.freeze({ x: 0, y: -1 }),
  Object.freeze({ x: -1, y: 0 }),
  Object.freeze({ x: 1, y: 0 }),
  Object.freeze({ x: 0, y: 1 }),
]);

/** Champignon stable : seule une croix complète provoque une naissance. */
export class MushroomEssence extends PatternDuplicatorEssence {
  readonly id = "mushroom";
  readonly name: string = "Mushroom";

  constructor(color: number = DEFAULT_MUSHROOM_COLOR) {
    super(color, MUSHROOM_BIRTH_PATTERN);
  }

  getWeatherRepercussion(
    weather: Readonly<WeatherSnapshot>,
  ): EssencePropertiesDelta {
    const suffersFromCold =
      weather.degrees < MUSHROOM_COLD_THRESHOLD_DEGREES &&
      weather.cycle % MUSHROOM_WEATHER_REPERCUSSION_INTERVAL === 0;

    return { life: suffersFromCold ? -MUSHROOM_COLD_LIFE_LOSS : 0 };
  }
}

/** Helper for tests — build input from coordinates. */
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

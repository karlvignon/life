import type {
  WeatherSnapshot,
  WeatherTransition,
  WeatherValues,
} from "./types";

const WIND_VARIATION_INTERVAL_IN_CYCLES = 23;
const DEGREE_VARIATION_INTERVAL_IN_CYCLES = 61;
const WIND_VARIATION_SEED = 0x51f15e;
const DEGREE_VARIATION_SEED = 0x7e4a11;

export class WeatherModel {
  private currentWindStrength = 0;
  private currentDegrees = 0;
  private seasonalWindStrength = 0;
  private seasonalDegrees = 0;
  private overrideEnabled = false;
  private currentCycle = 0;
  private snapshot: WeatherSnapshot = Object.freeze({
    cycle: 0,
    windStrength: 0,
    degrees: 0,
  });

  updateFromSeason(transition: WeatherTransition): void {
    validateTransition(transition);
    this.currentCycle = transition.currentCycle;

    const windRange = interpolateRange(
      transition.currentSeason.windStrenghRange,
      transition.nextSeason.windStrenghRange,
      transition.progress,
    );
    const degreeRange = interpolateRange(
      transition.currentSeason.degreeRange,
      transition.nextSeason.degreeRange,
      transition.progress,
    );

    this.seasonalWindStrength = sampleRange(
      windRange,
      smoothVariation(
        transition.currentCycle,
        WIND_VARIATION_INTERVAL_IN_CYCLES,
        WIND_VARIATION_SEED,
      ),
    );
    this.seasonalDegrees = sampleRange(
      degreeRange,
      smoothVariation(
        transition.currentCycle,
        DEGREE_VARIATION_INTERVAL_IN_CYCLES,
        DEGREE_VARIATION_SEED,
      ),
    );

    if (!this.overrideEnabled) {
      this.currentWindStrength = this.seasonalWindStrength;
      this.currentDegrees = this.seasonalDegrees;
    }

    this.refreshSnapshot();
  }

  setOverride(snapshot: WeatherValues): void {
    validateSnapshot(snapshot);
    this.overrideEnabled = true;
    this.currentWindStrength = snapshot.windStrength;
    this.currentDegrees = snapshot.degrees;
    this.refreshSnapshot();
  }

  clearOverride(): void {
    this.overrideEnabled = false;
    this.currentWindStrength = this.seasonalWindStrength;
    this.currentDegrees = this.seasonalDegrees;
    this.refreshSnapshot();
  }

  isOverrideEnabled(): boolean {
    return this.overrideEnabled;
  }

  getCurrentWindStrength(): number {
    return this.currentWindStrength;
  }

  getCurrentDegrees(): number {
    return this.currentDegrees;
  }

  getSnapshot(): WeatherSnapshot {
    return this.snapshot;
  }

  private refreshSnapshot(): void {
    this.snapshot = Object.freeze({
      cycle: this.currentCycle,
      windStrength: this.currentWindStrength,
      degrees: this.currentDegrees,
    });
  }
}

function interpolateRange(
  current: readonly [number, number],
  next: readonly [number, number],
  progress: number,
): readonly [number, number] {
  return [
    lerp(current[0], next[0], progress),
    lerp(current[1], next[1], progress),
  ];
}

function sampleRange(
  range: readonly [number, number],
  normalizedValue: number,
): number {
  return lerp(range[0], range[1], normalizedValue);
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

/**
 * Produit une variation continue entre des cibles pseudo-aleatoires.
 * Le cycle 0 part du milieu de la plage pour une initialisation previsible.
 */
function smoothVariation(
  cycle: number,
  interval: number,
  seed: number,
): number {
  const targetIndex = Math.floor(cycle / interval);
  const progress = (cycle % interval) / interval;
  const easedProgress = progress * progress * (3 - 2 * progress);

  return lerp(
    variationTarget(targetIndex, seed),
    variationTarget(targetIndex + 1, seed),
    easedProgress,
  );
}

function variationTarget(index: number, seed: number): number {
  if (index === 0) {
    return 0.5;
  }

  let value = (index + seed) | 0;
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad);
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
  value ^= value >>> 15;

  return (value >>> 0) / 0xffffffff;
}

function validateTransition(transition: WeatherTransition): void {
  if (
    !Number.isSafeInteger(transition.currentCycle) ||
    transition.currentCycle < 0
  ) {
    throw new RangeError("currentCycle must be a non-negative safe integer");
  }

  validateRange(
    transition.currentSeason.windStrenghRange,
    "currentSeason.windStrenghRange",
  );
  validateRange(
    transition.currentSeason.degreeRange,
    "currentSeason.degreeRange",
  );
  validateRange(
    transition.nextSeason.windStrenghRange,
    "nextSeason.windStrenghRange",
  );
  validateRange(transition.nextSeason.degreeRange, "nextSeason.degreeRange");

  if (
    !Number.isFinite(transition.progress) ||
    transition.progress < 0 ||
    transition.progress > 1
  ) {
    throw new RangeError("progress must be between 0 and 1");
  }
}

function validateRange(range: readonly [number, number], label: string): void {
  if (
    !Number.isFinite(range[0]) ||
    !Number.isFinite(range[1]) ||
    range[0] > range[1]
  ) {
    throw new RangeError(`${label} must contain two finite ordered values`);
  }
}

function validateSnapshot(snapshot: WeatherValues): void {
  if (
    !Number.isFinite(snapshot.windStrength) ||
    !Number.isFinite(snapshot.degrees)
  ) {
    throw new RangeError("weather override values must be finite");
  }
}

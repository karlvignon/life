import type { WeatherSnapshot, WeatherTransition } from "./types";

export class WeatherModel {
  private currentWindStrength = 0;
  private currentDegrees = 0;
  private seasonalWindStrength = 0;
  private seasonalDegrees = 0;
  private overrideEnabled = false;

  updateFromSeason(transition: WeatherTransition): void {
    validateTransition(transition);

    const currentWindTarget = midpoint(
      transition.currentSeason.windStrenghRange,
    );
    const nextWindTarget = midpoint(transition.nextSeason.windStrenghRange);
    const currentDegreeTarget = midpoint(transition.currentSeason.degreeRange);
    const nextDegreeTarget = midpoint(transition.nextSeason.degreeRange);

    this.seasonalWindStrength = lerp(
      currentWindTarget,
      nextWindTarget,
      transition.progress,
    );
    this.seasonalDegrees = lerp(
      currentDegreeTarget,
      nextDegreeTarget,
      transition.progress,
    );

    if (!this.overrideEnabled) {
      this.currentWindStrength = this.seasonalWindStrength;
      this.currentDegrees = this.seasonalDegrees;
    }
  }

  setOverride(snapshot: WeatherSnapshot): void {
    validateSnapshot(snapshot);
    this.overrideEnabled = true;
    this.currentWindStrength = snapshot.windStrength;
    this.currentDegrees = snapshot.degrees;
  }

  clearOverride(): void {
    this.overrideEnabled = false;
    this.currentWindStrength = this.seasonalWindStrength;
    this.currentDegrees = this.seasonalDegrees;
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
    return {
      windStrength: this.currentWindStrength,
      degrees: this.currentDegrees,
    };
  }
}

function midpoint(range: readonly [number, number]): number {
  return (range[0] + range[1]) / 2;
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function validateTransition(transition: WeatherTransition): void {
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

function validateSnapshot(snapshot: WeatherSnapshot): void {
  if (
    !Number.isFinite(snapshot.windStrength) ||
    !Number.isFinite(snapshot.degrees)
  ) {
    throw new RangeError("weather override values must be finite");
  }
}

import type { WeatherSnapshot, WeatherTransition } from "./types";

export class WeatherModel {
  private currentWindStrength = 0;
  private currentDegrees = 0;

  updateFromSeason(transition: WeatherTransition): void {
    validateTransition(transition);

    const currentWindTarget = midpoint(
      transition.currentSeason.windStrenghRange,
    );
    const nextWindTarget = midpoint(transition.nextSeason.windStrenghRange);
    const currentDegreeTarget = midpoint(transition.currentSeason.degreeRange);
    const nextDegreeTarget = midpoint(transition.nextSeason.degreeRange);

    this.currentWindStrength = lerp(
      currentWindTarget,
      nextWindTarget,
      transition.progress,
    );
    this.currentDegrees = lerp(
      currentDegreeTarget,
      nextDegreeTarget,
      transition.progress,
    );
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

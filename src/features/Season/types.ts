import type { SeasonName } from "../../core/types/weather";

export type { SeasonName } from "../../core/types/weather";

export type SeasonRange = readonly [min: number, max: number];

export interface SeasonConfig {
  seasonDurationInCycles?: number;
  seasons?: ReadonlyArray<Season>;
}

export class Season {
  readonly windStrenghRange: SeasonRange;
  readonly degreeRange: SeasonRange;

  constructor(
    readonly name: SeasonName,
    windStrenghRange: SeasonRange,
    degreeRange: SeasonRange,
  ) {
    this.windStrenghRange = validateRange(windStrenghRange, "windStrenghRange");
    this.degreeRange = validateRange(degreeRange, "degreeRange");
  }
}

export class Spring extends Season {
  constructor(
    windStrenghRange: SeasonRange = [5, 30],
    degreeRange: SeasonRange = [8, 20],
  ) {
    super("Spring", windStrenghRange, degreeRange);
  }
}

export class Summer extends Season {
  constructor(
    windStrenghRange: SeasonRange = [0, 20],
    degreeRange: SeasonRange = [20, 35],
  ) {
    super("Summer", windStrenghRange, degreeRange);
  }
}

export class Autumn extends Season {
  constructor(
    windStrenghRange: SeasonRange = [10, 40],
    degreeRange: SeasonRange = [5, 18],
  ) {
    super("Autumn", windStrenghRange, degreeRange);
  }
}

export class Winter extends Season {
  constructor(
    windStrenghRange: SeasonRange = [15, 50],
    degreeRange: SeasonRange = [-10, 8],
  ) {
    super("Winter", windStrenghRange, degreeRange);
  }
}

export const DEFAULT_SEASON_DURATION_IN_CYCLES = 1000;

export const DEFAULT_SEASONS: ReadonlyArray<Season> = Object.freeze([
  new Spring(),
  new Summer(),
  new Autumn(),
  new Winter(),
]);

function validateRange(range: SeasonRange, label: string): SeasonRange {
  const [min, max] = range;

  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
    throw new RangeError(`${label} must contain two finite ordered values`);
  }

  return Object.freeze([min, max]);
}

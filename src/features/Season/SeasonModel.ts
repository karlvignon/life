import {
  DEFAULT_SEASON_DURATION_IN_CYCLES,
  DEFAULT_SEASONS,
  type Season,
} from "./types";

function assertValidCycle(cycle: number): void {
  if (!Number.isSafeInteger(cycle) || cycle < 0) {
    throw new RangeError("current cycle must be a non-negative safe integer");
  }
}

export class SeasonModel {
  private readonly seasons: ReadonlyArray<Season>;

  constructor(
    seasons: ReadonlyArray<Season> = DEFAULT_SEASONS,
    private readonly seasonDurationInCycles = DEFAULT_SEASON_DURATION_IN_CYCLES,
  ) {
    if (seasons.length === 0) {
      throw new RangeError("SeasonModel requires at least one season");
    }

    if (
      !Number.isInteger(seasonDurationInCycles) ||
      seasonDurationInCycles <= 0
    ) {
      throw new RangeError("seasonDurationInCycles must be a positive integer");
    }

    this.seasons = Object.freeze([...seasons]);
  }

  getCurrentSeason(cycle: number): Season {
    assertValidCycle(cycle);
    return this.seasons[this.getCurrentSeasonIndex(cycle)];
  }

  getNextSeason(cycle: number): Season {
    assertValidCycle(cycle);
    const nextSeasonIndex =
      (this.getCurrentSeasonIndex(cycle) + 1) % this.seasons.length;

    return this.seasons[nextSeasonIndex];
  }

  getSeasons(): ReadonlyArray<Season> {
    return this.seasons;
  }

  getSeasonDurationInCycles(): number {
    return this.seasonDurationInCycles;
  }

  getCycleInCurrentSeason(cycle: number): number {
    assertValidCycle(cycle);
    return cycle % this.seasonDurationInCycles;
  }

  getTransitionProgress(cycle: number): number {
    return this.getCycleInCurrentSeason(cycle) / this.seasonDurationInCycles;
  }

  private getCurrentSeasonIndex(cycle: number): number {
    return (
      Math.floor(cycle / this.seasonDurationInCycles) % this.seasons.length
    );
  }
}

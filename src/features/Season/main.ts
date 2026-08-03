import type { EventBus } from "../../core/EventBus";
import { gameCycle } from "../../core/GameCycle";
import type { GameEventMap } from "../../core/types/gameEvents";
import { SeasonModel } from "./SeasonModel";
import {
  DEFAULT_SEASON_DURATION_IN_CYCLES,
  DEFAULT_SEASONS,
  type SeasonConfig,
} from "./types";

export type { SeasonName, SeasonConfig, SeasonRange } from "./types";
export {
  Autumn,
  DEFAULT_SEASON_DURATION_IN_CYCLES,
  DEFAULT_SEASONS,
  Season,
  Spring,
  Summer,
  Winter,
} from "./types";

export class SeasonManager {
  private readonly model: SeasonModel;
  private lastProcessedCycle = -1;

  constructor(
    private readonly gameEventBus: EventBus,
    config: SeasonConfig = {},
  ) {
    this.model = new SeasonModel(
      config.seasons ?? DEFAULT_SEASONS,
      config.seasonDurationInCycles ?? DEFAULT_SEASON_DURATION_IN_CYCLES,
    );

    this.syncFromCurrentCycle();
  }

  update(): void {
    const cycle = gameCycle.getCurrentCycle();
    if (cycle === this.lastProcessedCycle) {
      return;
    }

    this.lastProcessedCycle = cycle;
    this.emitSeasonProgressed(cycle);
  }

  render(): void {}

  destroy(): void {}

  private syncFromCurrentCycle(): void {
    const cycle = gameCycle.getCurrentCycle();
    this.lastProcessedCycle = cycle;
    this.emitSeasonProgressed(cycle);
  }

  private emitSeasonProgressed(cycle: number): void {
    const currentSeason = this.model.getCurrentSeason(cycle);
    const nextSeason = this.model.getNextSeason(cycle);

    this.gameEventBus.emit<GameEventMap["game:season-progressed"]>(
      "game:season-progressed",
      {
        currentSeason: {
          windStrenghRange: currentSeason.windStrenghRange,
          degreeRange: currentSeason.degreeRange,
        },
        nextSeason: {
          windStrenghRange: nextSeason.windStrenghRange,
          degreeRange: nextSeason.degreeRange,
        },
        progress: this.model.getTransitionProgress(cycle),
      },
    );
  }
}

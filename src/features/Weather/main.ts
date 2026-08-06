import type { EventBus } from "../../core/EventBus";
import type { GameEventMap } from "../../core/types/gameEvents";
import { WeatherModel } from "./WeatherModel";
import type { WeatherSnapshot } from "./types";

export type {
  SeasonWeatherSnapshot,
  WeatherRange,
  WeatherSnapshot,
  WeatherTransition,
  WeatherValues,
} from "./types";

export class WeatherManager {
  private readonly model = new WeatherModel();
  private readonly unsubscribeSeasonProgressed: () => void;
  private readonly unsubscribeWeatherOverride: () => void;

  constructor(private readonly gameEventBus: EventBus) {
    this.unsubscribeSeasonProgressed = this.gameEventBus.on<
      GameEventMap["game:season-progressed"]
    >("game:season-progressed", (transition) => {
      this.model.updateFromSeason(transition);
      this.emitWeatherChanged();
    });
    this.unsubscribeWeatherOverride = this.gameEventBus.on<
      GameEventMap["dev:weather-override-changed"]
    >("dev:weather-override-changed", (override) => {
      if (override.enabled) {
        this.model.setOverride(override);
      } else {
        this.model.clearOverride();
      }

      this.emitWeatherChanged();
    });
  }

  getSnapshot(): Readonly<WeatherSnapshot> {
    return this.model.getSnapshot();
  }

  destroy(): void {
    this.unsubscribeSeasonProgressed();
    this.unsubscribeWeatherOverride();
  }

  private emitWeatherChanged(): void {
    this.gameEventBus.emit<GameEventMap["game:weather-changed"]>(
      "game:weather-changed",
      this.model.getSnapshot(),
    );
  }
}

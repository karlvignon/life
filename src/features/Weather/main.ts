import { Application, Container, Rectangle } from "pixi.js";
import type { EventBus } from "../../core/EventBus";
import type { GameEventMap } from "../../core/types/gameEvents";
import { WeatherModel } from "./WeatherModel";
import { WeatherView } from "./WeatherView";
import type { WeatherConfig } from "./types";

export type {
  SeasonWeatherSnapshot,
  WeatherConfig,
  WeatherRange,
  WeatherSnapshot,
  WeatherTransition,
  WeatherUiLayoutConfig,
} from "./types";
export { DEFAULT_WEATHER_UI_LAYOUT } from "./types";

export class WeatherManager {
  private readonly model = new WeatherModel();
  private readonly uiRoot = new Container();
  private readonly view: WeatherView;
  private readonly unsubscribeSeasonProgressed: () => void;
  private readonly unsubscribeWeatherOverride: () => void;
  private renderDirty = true;

  private readonly onResize = (): void => {
    this.layout();
  };

  constructor(
    private readonly app: Application,
    private readonly gameEventBus: EventBus,
    config: WeatherConfig = {},
  ) {
    this.view = new WeatherView(config.layout);
    this.uiRoot.label = "weatherUiRoot";
    this.uiRoot.eventMode = "none";
    this.uiRoot.addChild(this.view);
    this.app.stage.addChild(this.uiRoot);

    this.unsubscribeSeasonProgressed = this.gameEventBus.on<
      GameEventMap["game:season-progressed"]
    >("game:season-progressed", (transition) => {
      this.model.updateFromSeason(transition);
      this.renderDirty = true;
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

      this.renderDirty = true;
      this.emitWeatherChanged();
    });

    this.layout();
    this.render();
    window.addEventListener("resize", this.onResize);
  }

  getCurrentWindStrength(): number {
    return this.model.getCurrentWindStrength();
  }

  getCurrentDegrees(): number {
    return this.model.getCurrentDegrees();
  }

  update(): void {}

  render(): void {
    if (!this.renderDirty) {
      return;
    }

    this.view.syncFromModel(this.model);
    this.renderDirty = false;
  }

  destroy(): void {
    window.removeEventListener("resize", this.onResize);
    this.unsubscribeSeasonProgressed();
    this.unsubscribeWeatherOverride();
    this.view.destroy();
    this.uiRoot.destroy({ children: true });
    this.app.stage.removeChild(this.uiRoot);
  }

  private emitWeatherChanged(): void {
    this.gameEventBus.emit<GameEventMap["game:weather-changed"]>(
      "game:weather-changed",
      this.model.getSnapshot(),
    );
  }

  private layout(): void {
    const bounds = {
      width: this.app.screen.width,
      height: this.app.screen.height,
    };

    this.uiRoot.hitArea = new Rectangle(0, 0, bounds.width, bounds.height);
    this.view.layoutWithinParent(bounds);
    this.app.stage.addChild(this.uiRoot);
  }
}

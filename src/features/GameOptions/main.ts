import { Application, Container, Rectangle } from "pixi.js";
import type { EventBus } from "../../core/EventBus";
import type {
  GameEventMap,
  GameSpeedSnapshot,
} from "../../core/types/gameEvents";
import type { WeatherSnapshot } from "../../core/types/weather";
import { GameOptionsView } from "./GameOptionsView";
import { GameOptionsModel } from "./GameOptionsModel";
import {
  DEFAULT_MAX_SPEED,
  DEFAULT_MIN_SPEED,
  DEFAULT_SPEED,
  type GameOptionsConfig,
} from "./types";

export type { GameOptionsConfig, GameOptionsUiLayoutConfig } from "./types";
export { DEFAULT_GAME_OPTIONS_UI_LAYOUT } from "./types";

export class GameOptionsManager {
  private readonly app: Application;
  private readonly gameEventBus: EventBus;
  private readonly uiRoot: Container;
  private readonly model: GameOptionsModel;
  private readonly view: GameOptionsView;
  private readonly unsubscribeWeatherChanged: () => void;
  private readonly unsubscribeSpeedChangeRequested: () => void;

  private readonly onResize = (): void => {
    this.layout();
  };

  constructor(
    app: Application,
    gameEventBus: EventBus,
    config: GameOptionsConfig = {},
    initialWeather?: Readonly<WeatherSnapshot>,
  ) {
    this.app = app;
    this.gameEventBus = gameEventBus;

    this.model = new GameOptionsModel(
      config.minSpeed ?? DEFAULT_MIN_SPEED,
      config.maxSpeed ?? DEFAULT_MAX_SPEED,
      config.initialSpeed ?? DEFAULT_SPEED,
    );
    if (initialWeather) {
      this.model.syncWeather(initialWeather);
    }

    this.uiRoot = new Container();
    this.uiRoot.label = "gameOptionsUiRoot";
    this.app.stage.addChild(this.uiRoot);

    this.view = new GameOptionsView(config.layout);
    this.uiRoot.addChild(this.view);
    this.view.syncFromModel(this.model);

    this.unsubscribeWeatherChanged = this.gameEventBus.on<
      GameEventMap["game:weather-changed"]
    >("game:weather-changed", (weather) => {
      this.model.syncWeather(weather);
      this.view.syncFromModel(this.model);
    });
    this.unsubscribeSpeedChangeRequested = this.gameEventBus.on<
      GameEventMap["dev:speed-change-requested"]
    >("dev:speed-change-requested", ({ speed }) => {
      this.model.setSpeed(speed);
      this.emitSpeedChanged();
    });
    this.layout();
    this.emitSpeedChanged();

    window.addEventListener("resize", this.onResize);
  }

  getSpeed(): number {
    return this.model.getSpeed();
  }

  getSpeedSnapshot(): GameSpeedSnapshot {
    return {
      speed: this.model.getSpeed(),
      minSpeed: this.model.getMinSpeed(),
      maxSpeed: this.model.getMaxSpeed(),
    };
  }

  getUiRoot(): Container {
    return this.uiRoot;
  }

  render(): void {}

  destroy(): void {
    window.removeEventListener("resize", this.onResize);
    this.unsubscribeWeatherChanged();
    this.unsubscribeSpeedChangeRequested();

    this.view.destroy();
    this.uiRoot.removeChild(this.view);
    this.uiRoot.destroy({ children: true });
    this.app.stage.removeChild(this.uiRoot);
  }

  private emitSpeedChanged(): void {
    this.gameEventBus.emit<GameEventMap["game:speed-changed"]>(
      "game:speed-changed",
      this.getSpeedSnapshot(),
    );
  }

  private layout(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    this.uiRoot.hitArea = new Rectangle(0, 0, width, height);
    this.view.layoutWithinParent({ width, height });
    this.app.stage.addChild(this.uiRoot);
  }
}

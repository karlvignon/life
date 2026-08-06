import { Application, Container } from "pixi.js";
import type { EventBus } from "../../core/EventBus";
import type { GameEventMap } from "../../core/types/gameEvents";
import { DevUIEventManager } from "./DevUIEventManager";
import { DevUIModel } from "./DevUIModel";
import { DevUIView } from "./DevUIView";
import {
  MAX_OVERRIDE_DEGREES,
  MAX_OVERRIDE_WIND_STRENGTH,
  MIN_OVERRIDE_DEGREES,
  MIN_OVERRIDE_WIND_STRENGTH,
} from "./types";

export type { DevOptions } from "./types";

export class DevUIManager {
  private readonly app: Application;
  private readonly uiRoot: Container;
  private readonly model = new DevUIModel();
  private readonly eventManager = new DevUIEventManager();
  private readonly view = new DevUIView(this.eventManager);
  private readonly unsubscribeWeatherChanged: () => void;

  constructor(
    app: Application,
    private readonly gameEventBus: EventBus,
  ) {
    this.app = app;
    this.uiRoot = new Container();
    this.uiRoot.label = "devUiRoot";
    this.uiRoot.eventMode = "passive";
    this.uiRoot.addChild(this.view);
    this.app.stage.addChild(this.uiRoot);

    this.bindEvents();
    this.unsubscribeWeatherChanged = this.gameEventBus.on<
      GameEventMap["game:weather-changed"]
    >("game:weather-changed", (snapshot) => {
      this.model.syncWeather(snapshot);
    });
  }

  update(): void {
    this.model.setFps(this.app.ticker.FPS);
  }

  render(): void {
    this.view.syncFromModel(this.model);
  }

  recordRenderTime(renderTimeMs: number): void {
    this.model.addRenderTime(renderTimeMs);
  }

  getUiRoot(): Container {
    return this.uiRoot;
  }

  destroy(): void {
    this.unsubscribeWeatherChanged();
    this.eventManager.destroy();
    this.view.destroy();
    this.uiRoot.destroy({ children: true });
    this.app.stage.removeChild(this.uiRoot);
  }

  private bindEvents(): void {
    this.eventManager.on("card-stamina-cost:toggle", ({ disabled }) => {
      this.model.setCardStaminaCostsDisabled(disabled);
      this.view.syncFromModel(this.model);
      this.gameEventBus.emit<GameEventMap["dev:card-stamina-cost-changed"]>(
        "dev:card-stamina-cost-changed",
        { disabled },
      );
    });
    this.eventManager.on("reproductibility-map:toggle", ({ enabled }) => {
      this.model.setReproductibilityMapEnabled(enabled);
      this.view.syncFromModel(this.model);
      this.gameEventBus.emit<GameEventMap["dev:reproductibility-map-changed"]>(
        "dev:reproductibility-map-changed",
        { enabled },
      );
    });
    this.eventManager.on("weather-override:toggle", ({ enabled }) => {
      this.model.setWeatherOverrideEnabled(enabled);
      this.view.syncFromModel(this.model);
      this.emitWeatherOverrideChanged();
    });
    this.eventManager.on("weather-override:wind-change", ({ windStrength }) => {
      this.model.setWindStrength(
        denormalize(
          windStrength,
          MIN_OVERRIDE_WIND_STRENGTH,
          MAX_OVERRIDE_WIND_STRENGTH,
        ),
      );
      this.view.syncFromModel(this.model);
      this.emitWeatherOverrideChanged();
    });
    this.eventManager.on("weather-override:degrees-change", ({ degrees }) => {
      this.model.setDegrees(
        denormalize(degrees, MIN_OVERRIDE_DEGREES, MAX_OVERRIDE_DEGREES),
      );
      this.view.syncFromModel(this.model);
      this.emitWeatherOverrideChanged();
    });
  }

  private emitWeatherOverrideChanged(): void {
    this.gameEventBus.emit<GameEventMap["dev:weather-override-changed"]>(
      "dev:weather-override-changed",
      {
        enabled: this.model.isWeatherOverrideEnabled(),
        windStrength: this.model.getWindStrength(),
        degrees: this.model.getDegrees(),
      },
    );
  }
}

function denormalize(normalized: number, min: number, max: number): number {
  return min + Math.min(1, Math.max(0, normalized)) * (max - min);
}

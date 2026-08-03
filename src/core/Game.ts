import { Application } from "pixi.js";
import { EventBus } from "./EventBus";
import { gameCycle } from "./GameCycle";
import { CellCreatorManager } from "../features/CellCreator/main";
import { GameOptionsManager } from "../features/GameOptions/main";
import { MapManager, type MapConfig } from "../features/MapManager/main";
import type { GameOptionsConfig } from "../features/GameOptions/main";
import { DevUIManager, type DevOptions } from "../features/DevUI/main";
import { SeasonManager, type SeasonConfig } from "../features/Season/main";
import { WeatherManager, type WeatherConfig } from "../features/Weather/main";

export interface GameConfig {
  map?: MapConfig;
  gameOptions?: GameOptionsConfig;
  devOptions?: DevOptions;
  season?: SeasonConfig;
  weather?: WeatherConfig;
}

export class Game {
  private readonly app: Application;
  private readonly eventBus = new EventBus();
  private readonly mapManager: MapManager;
  private readonly gameOptionsManager: GameOptionsManager;
  private readonly cellCreatorManager: CellCreatorManager;
  private readonly devUIManager: DevUIManager | null;
  private readonly seasonManager: SeasonManager;
  private readonly weatherManager: WeatherManager;

  constructor(app: Application, config: GameConfig) {
    this.app = app;
    gameCycle.reset();

    this.mapManager = new MapManager(app, config.map, this.eventBus);
    this.mapManager.setChunkRenderDebugEnabled(
      config.devOptions?.display.displayChunkRender ?? false,
    );
    this.gameOptionsManager = new GameOptionsManager(
      app,
      this.eventBus,
      config.gameOptions,
    );
    this.cellCreatorManager = new CellCreatorManager(
      app,
      this.eventBus,
      this.mapManager,
    );
    this.cellCreatorManager.registerUiRootToIgnore(this.mapManager.getUiRoot());
    this.cellCreatorManager.registerUiRootToIgnore(
      this.gameOptionsManager.getUiRoot(),
    );
    this.weatherManager = new WeatherManager(
      app,
      this.eventBus,
      config.weather,
    );
    this.seasonManager = new SeasonManager(this.eventBus, config.season);
    this.devUIManager = config.devOptions?.display.devUi
      ? new DevUIManager(app)
      : null;

    this.app.ticker.add((ticker) => {
      this.update(ticker.deltaMS);

      const renderStartedAt = performance.now();
      this.render();
      this.devUIManager?.recordRenderTime(performance.now() - renderStartedAt);
    });
  }

  destroy(): void {
    this.app.ticker.stop();
    this.devUIManager?.destroy();
    this.seasonManager.destroy();
    this.weatherManager.destroy();
    this.mapManager.destroy();
    this.gameOptionsManager.destroy();
    this.cellCreatorManager.destroy();
    this.eventBus.clear();
    gameCycle.reset();
  }

  private update(dtMs: number): void {
    this.mapManager.update(dtMs);
    this.seasonManager.update();
    this.weatherManager.update();
    this.devUIManager?.update();
  }

  private render(): void {
    if (
      this.mapManager.needsRender() ||
      this.cellCreatorManager.needsRender()
    ) {
      this.mapManager.render();
      this.cellCreatorManager.render();
    }

    this.gameOptionsManager.render();
    this.seasonManager.render();
    this.weatherManager.render();
    this.devUIManager?.render();
  }
}

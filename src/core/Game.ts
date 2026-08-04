import { Application } from "pixi.js";
import { EventBus } from "./EventBus";
import { GameData, type GameDataConfig } from "./GameData";
import { gameCycle } from "./GameCycle";
import { CellCreatorManager } from "../features/CellCreator/main";
import { GameOptionsManager } from "../features/GameOptions/main";
import { MapManager, type MapConfig } from "../features/MapManager/main";
import type { GameOptionsConfig } from "../features/GameOptions/main";
import { DevUIManager, type DevOptions } from "../features/DevUI/main";
import { SeasonManager, type SeasonConfig } from "../features/Season/main";
import { WeatherManager, type WeatherConfig } from "../features/Weather/main";
import { PlayerManager, type PlayerConfig } from "../features/Player/main";

export interface GameConfig {
  map?: MapConfig;
  gameOptions?: GameOptionsConfig;
  devOptions?: DevOptions;
  season?: SeasonConfig;
  weather?: WeatherConfig;
  gameData?: GameDataConfig;
  player?: PlayerConfig;
}

export class Game {
  readonly gameData: GameData;
  private readonly app: Application;
  private readonly eventBus = new EventBus();
  private readonly mapManager: MapManager;
  private readonly gameOptionsManager: GameOptionsManager;
  private readonly cellCreatorManager: CellCreatorManager;
  private readonly devUIManager: DevUIManager | null;
  private readonly seasonManager: SeasonManager;
  private readonly weatherManager: WeatherManager;
  private readonly playerManager: PlayerManager;

  constructor(app: Application, config: GameConfig) {
    this.app = app;
    this.gameData = new GameData(config.gameData);
    gameCycle.reset();

    this.mapManager = new MapManager(app, config.map);
    this.mapManager.setChunkRenderDebugEnabled(
      config.devOptions?.display.displayChunkRender ?? false,
    );
    this.gameOptionsManager = new GameOptionsManager(
      app,
      this.eventBus,
      config.gameOptions,
    );
    this.playerManager = new PlayerManager(
      app,
      this.gameData.staminaRecoveryPerSecond,
      config.player,
    );
    this.cellCreatorManager = new CellCreatorManager(
      app,
      this.eventBus,
      this.mapManager,
      this.playerManager,
    );
    this.cellCreatorManager.registerUiRootToIgnore(this.mapManager.getUiRoot());
    this.cellCreatorManager.registerUiRootToIgnore(
      this.gameOptionsManager.getUiRoot(),
    );
    this.cellCreatorManager.registerUiRootToIgnore(
      this.playerManager.getUiRoot(),
    );
    this.weatherManager = new WeatherManager(
      app,
      this.eventBus,
      config.weather,
    );
    this.devUIManager = config.devOptions?.display.devUi
      ? new DevUIManager(app, this.eventBus)
      : null;
    if (this.devUIManager) {
      this.cellCreatorManager.registerUiRootToIgnore(
        this.devUIManager.getUiRoot(),
      );
    }
    this.seasonManager = new SeasonManager(this.eventBus, config.season);

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
    this.cellCreatorManager.destroy();
    this.playerManager.destroy();
    this.mapManager.destroy();
    this.gameOptionsManager.destroy();
    this.eventBus.clear();
    gameCycle.reset();
  }

  private update(dtMs: number): void {
    this.mapManager.update(dtMs);
    this.playerManager.update(dtMs);

    const dueCycles = gameCycle.consumeDueCycles(
      dtMs,
      this.gameOptionsManager.getSpeed(),
    );

    for (const cycle of dueCycles) {
      this.seasonManager.syncToCycle(cycle);
      this.mapManager.step(cycle, this.weatherManager.getSnapshot());
    }

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
    this.playerManager.render();
    this.devUIManager?.render();
  }
}

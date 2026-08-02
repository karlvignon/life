import { Application } from "pixi.js";
import { EventBus } from "./EventBus";
import { CellCreatorManager } from "../features/CellCreator/main";
import { GameOptionsManager } from "../features/GameOptions/main";
import { MapManager, type MapConfig } from "../features/MapManager/main";
import type { GameOptionsConfig } from "../features/GameOptions/main";

export interface GameConfig {
  map?: MapConfig;
  gameOptions?: GameOptionsConfig;
}

export class Game {
  private readonly app: Application;
  private readonly eventBus = new EventBus();
  private readonly mapManager: MapManager;
  private readonly gameOptionsManager: GameOptionsManager;
  private readonly cellCreatorManager: CellCreatorManager;

  constructor(app: Application, config: GameConfig) {
    this.app = app;

    this.mapManager = new MapManager(app, config.map, this.eventBus);
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

    this.app.ticker.add((ticker) => {
      this.update(ticker.deltaMS);
      this.render();
    });
  }

  destroy(): void {
    this.app.ticker.stop();
    this.mapManager.destroy();
    this.gameOptionsManager.destroy();
    this.cellCreatorManager.destroy();
    this.eventBus.clear();
  }

  private update(dtMs: number): void {
    this.mapManager.update(dtMs);
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
  }
}

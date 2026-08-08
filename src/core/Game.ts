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
import { WeatherManager } from "../features/Weather/main";
import {
  DEFAULT_PLAYER_ID,
  FOURTH_LOCAL_PLAYER_ID,
  PlayerManager,
  SECOND_LOCAL_PLAYER_ID,
  THIRD_LOCAL_PLAYER_ID,
  type PlayerConfig,
} from "../features/Player/main";
import { BLUE_TEAM_ID, RED_TEAM_ID, TeamManager } from "../features/Team/main";
import type { GameEventMap } from "./types/gameEvents";

export interface GameConfig {
  map?: MapConfig;
  gameOptions?: GameOptionsConfig;
  devOptions?: DevOptions;
  season?: SeasonConfig;
  gameData?: GameDataConfig;
  player?: PlayerConfig;
}

export class Game {
  readonly gameData: GameData;
  private readonly app: Application;
  private readonly eventBus = new EventBus();
  private readonly mapManager: MapManager;
  private readonly teamManager: TeamManager;
  private readonly gameOptionsManager: GameOptionsManager;
  private readonly cellCreatorManager: CellCreatorManager;
  private readonly devUIManager: DevUIManager | null;
  private readonly seasonManager: SeasonManager;
  private readonly weatherManager: WeatherManager;
  private readonly playerManager: PlayerManager;
  private readonly unsubscribeReproductibilityMapChanged: () => void;
  private readonly unsubscribeSeedRangeMapChanged: () => void;
  private readonly unsubscribeTeamColorsChanged: () => void;

  constructor(app: Application, config: GameConfig) {
    this.app = app;
    this.gameData = new GameData(config.gameData);
    gameCycle.reset();

    const playerConfigs = createLocalPlayerConfigs(config.player);
    this.teamManager = new TeamManager();
    this.teamManager.registerPlayer(playerConfigs[0].id!, BLUE_TEAM_ID);
    this.teamManager.registerPlayer(playerConfigs[1].id!, BLUE_TEAM_ID);
    this.teamManager.registerPlayer(playerConfigs[2].id!, RED_TEAM_ID);
    this.teamManager.registerPlayer(playerConfigs[3].id!, RED_TEAM_ID);

    this.mapManager = new MapManager(app, config.map, this.teamManager);
    this.mapManager.setChunkRenderDebugEnabled(
      config.devOptions?.display.displayChunkRender ?? false,
    );
    this.unsubscribeReproductibilityMapChanged = this.eventBus.on<
      GameEventMap["dev:reproductibility-map-changed"]
    >("dev:reproductibility-map-changed", ({ enabled }) => {
      this.mapManager.setReproductibilityMapEnabled(enabled);
    });
    this.unsubscribeSeedRangeMapChanged = this.eventBus.on<
      GameEventMap["dev:seed-range-map-changed"]
    >("dev:seed-range-map-changed", ({ enabled }) => {
      this.mapManager.setSeedRangeMapEnabled(enabled);
    });
    this.unsubscribeTeamColorsChanged = this.eventBus.on<
      GameEventMap["dev:team-colors-changed"]
    >("dev:team-colors-changed", ({ enabled }) => {
      this.mapManager.setTeamColorsEnabled(enabled);
    });
    this.weatherManager = new WeatherManager(this.eventBus);
    this.gameOptionsManager = new GameOptionsManager(
      app,
      this.eventBus,
      config.gameOptions,
      this.weatherManager.getSnapshot(),
    );
    this.playerManager = new PlayerManager(
      app,
      this.gameData.staminaRecoveryPerSecond,
      playerConfigs,
      this.teamManager,
    );
    this.mapManager.setSeedRangePlayer(this.playerManager.getPlayerId());
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
    this.devUIManager = config.devOptions?.display.devUi
      ? new DevUIManager(
          app,
          this.eventBus,
          this.gameOptionsManager.getSpeedSnapshot(),
        )
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
    this.unsubscribeReproductibilityMapChanged();
    this.unsubscribeSeedRangeMapChanged();
    this.unsubscribeTeamColorsChanged();
    this.devUIManager?.destroy();
    this.seasonManager.destroy();
    this.weatherManager.destroy();
    this.cellCreatorManager.destroy();
    this.playerManager.destroy();
    this.mapManager.destroy();
    this.teamManager.destroy();
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
    this.mapManager.setSeedRangePlayer(this.playerManager.getPlayerId());

    if (
      this.mapManager.needsRender() ||
      this.cellCreatorManager.needsRender()
    ) {
      this.mapManager.render();
      this.cellCreatorManager.render();
    }

    this.gameOptionsManager.render();
    this.seasonManager.render();
    this.playerManager.render();
    this.devUIManager?.render();
  }
}

function createLocalPlayerConfigs(
  primaryConfig: PlayerConfig = {},
): ReadonlyArray<PlayerConfig & { id: string }> {
  return Object.freeze([
    {
      ...primaryConfig,
      id: primaryConfig.id ?? DEFAULT_PLAYER_ID,
      label: primaryConfig.label ?? "Player 1",
    },
    { id: SECOND_LOCAL_PLAYER_ID, label: "Player 2" },
    { id: THIRD_LOCAL_PLAYER_ID, label: "Player 3" },
    { id: FOURTH_LOCAL_PLAYER_ID, label: "Player 4" },
  ]);
}

import { Application, Container, Rectangle } from "pixi.js";
import type { EventBus } from "../../core/EventBus";
import type { GameEventMap } from "../../core/types/gameEvents";
import { GameOptionUi } from "./GameOptionUi";
import { GameOptionsEventManager } from "./GameOptionsEventManager";
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
  private readonly view: GameOptionUi;
  private readonly eventManager = new GameOptionsEventManager();

  private readonly onResize = (): void => {
    this.layout();
  };

  constructor(
    app: Application,
    gameEventBus: EventBus,
    config: GameOptionsConfig = {},
  ) {
    this.app = app;
    this.gameEventBus = gameEventBus;

    this.model = new GameOptionsModel(
      config.minSpeed ?? DEFAULT_MIN_SPEED,
      config.maxSpeed ?? DEFAULT_MAX_SPEED,
      config.initialSpeed ?? DEFAULT_SPEED,
    );

    this.uiRoot = new Container();
    this.uiRoot.label = "gameOptionsUiRoot";
    this.app.stage.addChild(this.uiRoot);

    this.view = new GameOptionUi(this.eventManager, config.layout);
    this.uiRoot.addChild(this.view);
    this.view.syncFromModel(this.model);

    this.bindEvents();
    this.layout();
    this.emitSpeedChanged();

    window.addEventListener("resize", this.onResize);
  }

  getSpeed(): number {
    return this.model.getSpeed();
  }

  getUiRoot(): Container {
    return this.uiRoot;
  }

  render(): void {}

  destroy(): void {
    window.removeEventListener("resize", this.onResize);
    this.eventManager.destroy();

    this.view.destroy();
    this.uiRoot.removeChild(this.view);
    this.uiRoot.destroy({ children: true });
    this.app.stage.removeChild(this.uiRoot);
  }

  private bindEvents(): void {
    this.eventManager.on("speed:change", ({ speed }) => {
      this.model.setSpeed(speed);
      this.view.syncFromModel(this.model);
      this.emitSpeedChanged();
    });
  }

  private emitSpeedChanged(): void {
    this.gameEventBus.emit<GameEventMap["game:speed-changed"]>(
      "game:speed-changed",
      { speed: this.model.getSpeed() },
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

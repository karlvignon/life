import { Application, Container, Rectangle } from "pixi.js";
import type { StaminaConsumer } from "../../core/types/player";
import { Player } from "./Player";
import { StaminaView } from "./StaminaView";
import type { PlayerConfig } from "./types";

export { Player } from "./Player";
export { StaminaView } from "./StaminaView";
export type { PlayerConfig, StaminaSnapshot } from "./types";

export class PlayerManager implements StaminaConsumer {
  private readonly uiRoot = new Container();
  private readonly model: Player;
  private readonly view = new StaminaView();

  private readonly onResize = (): void => {
    this.layout();
  };

  constructor(
    private readonly app: Application,
    private readonly staminaRecoveryPerSecond: number,
    config: PlayerConfig = {},
  ) {
    this.model = new Player(config);
    this.uiRoot.label = "playerUiRoot";
    this.uiRoot.addChild(this.view);
    this.app.stage.addChild(this.uiRoot);

    this.layout();
    this.render();
    window.addEventListener("resize", this.onResize);
  }

  update(dtMs: number): void {
    if (!Number.isFinite(dtMs) || dtMs < 0) {
      return;
    }

    this.model.recoverStamina(this.staminaRecoveryPerSecond * (dtMs / 1_000));
  }

  render(): void {
    this.view.syncFromModel(this.model);
  }

  trySpendStamina(cost: number): boolean {
    return this.model.trySpendStamina(cost);
  }

  getPlayer(): Player {
    return this.model;
  }

  getUiRoot(): Container {
    return this.uiRoot;
  }

  destroy(): void {
    window.removeEventListener("resize", this.onResize);
    this.uiRoot.removeChild(this.view);
    this.view.destroy();
    this.uiRoot.destroy();
    this.app.stage.removeChild(this.uiRoot);
  }

  private layout(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    this.uiRoot.hitArea = new Rectangle(0, 0, width, height);
    this.view.layoutWithinParent({ width, height });
    this.app.stage.addChild(this.uiRoot);
  }
}

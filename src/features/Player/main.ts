import { Application, Container, Rectangle } from "pixi.js";
import type { PlacementActor, PlayerId } from "../../core/types/player";
import type { TeamResolver } from "../../core/types/team";
import { Player } from "./Player";
import { PlayerEventManager } from "./PlayerEventManager";
import { PlayerRosterModel } from "./PlayerRosterModel";
import { PlayerSelectorView } from "./PlayerSelectorView";
import { StaminaView } from "./StaminaView";
import type { PlayerConfig, PlayerSelectionOption } from "./types";

export { Player } from "./Player";
export { PlayerRosterModel } from "./PlayerRosterModel";
export { PlayerSelectorView } from "./PlayerSelectorView";
export { StaminaView } from "./StaminaView";
export {
  DEFAULT_PLAYER_ID,
  FOURTH_LOCAL_PLAYER_ID,
  SECOND_LOCAL_PLAYER_ID,
  THIRD_LOCAL_PLAYER_ID,
} from "./types";
export type {
  PlayerConfig,
  PlayerSelectionOption,
  StaminaSnapshot,
} from "./types";

export class PlayerManager implements PlacementActor {
  private readonly uiRoot = new Container();
  private readonly model: PlayerRosterModel;
  private readonly eventManager = new PlayerEventManager();
  private readonly staminaView = new StaminaView();
  private readonly selectorView: PlayerSelectorView;

  private readonly onResize = (): void => {
    this.layout();
  };

  constructor(
    private readonly app: Application,
    private readonly staminaRecoveryPerSecond: number,
    configs: PlayerConfig | ReadonlyArray<PlayerConfig>,
    teamResolver: TeamResolver,
  ) {
    const rosterConfigs = Array.isArray(configs) ? configs : [configs];
    this.model = new PlayerRosterModel(rosterConfigs);
    this.selectorView = new PlayerSelectorView(
      this.createSelectionOptions(teamResolver),
      this.eventManager,
    );
    this.uiRoot.label = "playerUiRoot";
    this.uiRoot.addChild(this.selectorView, this.staminaView);
    this.app.stage.addChild(this.uiRoot);

    this.eventManager.on("player:select", ({ playerId }) => {
      if (this.model.selectPlayer(playerId)) {
        this.render();
      }
    });

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
    const player = this.model.getSelectedPlayer();
    this.staminaView.syncFromModel(player);
    this.selectorView.syncSelectedPlayer(player.getId());
  }

  trySpendStamina(cost: number): boolean {
    return this.model.getSelectedPlayer().trySpendStamina(cost);
  }

  getPlayerId(): PlayerId {
    return this.model.getSelectedPlayer().getId();
  }

  getPlayer(): Player {
    return this.model.getSelectedPlayer();
  }

  getPlayers(): ReadonlyArray<Player> {
    return this.model.getPlayers();
  }

  getUiRoot(): Container {
    return this.uiRoot;
  }

  destroy(): void {
    window.removeEventListener("resize", this.onResize);
    this.eventManager.destroy();
    this.uiRoot.removeChild(this.selectorView, this.staminaView);
    this.selectorView.destroy();
    this.staminaView.destroy();
    this.uiRoot.destroy();
    this.app.stage.removeChild(this.uiRoot);
  }

  private layout(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    this.uiRoot.hitArea = new Rectangle(0, 0, width, height);
    this.selectorView.layoutWithinParent({ width, height });
    this.staminaView.layoutWithinParent({ width, height });
    this.app.stage.addChild(this.uiRoot);
  }

  private createSelectionOptions(
    teamResolver: TeamResolver,
  ): PlayerSelectionOption[] {
    return this.model.getPlayers().map((player) => {
      const team = teamResolver.getPlayerTeam(player.getId());
      if (!team) {
        throw new Error(`Player ${player.getId()} must belong to a team`);
      }

      return {
        id: player.getId(),
        label: player.getLabel(),
        teamId: team.id,
        teamLabel: team.label,
        teamColor: team.color,
      };
    });
  }
}

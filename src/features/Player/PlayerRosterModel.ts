import type { PlayerId } from "../../core/types/player";
import { Player } from "./Player";
import type { PlayerConfig } from "./types";

/** Roster local et sélection du joueur auteur des prochaines poses. */
export class PlayerRosterModel {
  private readonly players: ReadonlyArray<Player>;
  private readonly playersById = new Map<PlayerId, Player>();
  private selectedPlayerId: PlayerId;

  constructor(configs: ReadonlyArray<PlayerConfig>) {
    if (configs.length === 0) {
      throw new RangeError("player roster must not be empty");
    }

    this.players = Object.freeze(configs.map((config) => new Player(config)));
    for (const player of this.players) {
      if (this.playersById.has(player.getId())) {
        throw new RangeError(`Duplicate player id: ${player.getId()}`);
      }
      this.playersById.set(player.getId(), player);
    }

    this.selectedPlayerId = this.players[0].getId();
  }

  getPlayers(): ReadonlyArray<Player> {
    return this.players;
  }

  getSelectedPlayer(): Player {
    return this.playersById.get(this.selectedPlayerId)!;
  }

  selectPlayer(playerId: PlayerId): boolean {
    if (!this.playersById.has(playerId)) {
      return false;
    }

    this.selectedPlayerId = playerId;
    return true;
  }

  recoverStamina(amount: number): void {
    for (const player of this.players) {
      player.recoverStamina(amount);
    }
  }
}

import type { PlayerId } from "../../core/types/player";
import type { TeamConfig, TeamSnapshot } from "./types";

/** État métier d'une équipe, indépendant de PixiJS. */
export class TeamModel {
  private readonly playerIds = new Set<PlayerId>();

  constructor(private readonly config: TeamConfig) {
    if (!config.id.trim()) {
      throw new RangeError("team id must not be empty");
    }
    if (!config.label.trim()) {
      throw new RangeError("team label must not be empty");
    }
    if (!Number.isSafeInteger(config.color) || config.color < 0) {
      throw new RangeError("team color must be a non-negative safe integer");
    }
  }

  registerPlayer(playerId: PlayerId): void {
    validatePlayerId(playerId);
    this.playerIds.add(playerId);
  }

  unregisterPlayer(playerId: PlayerId): void {
    this.playerIds.delete(playerId);
  }

  hasPlayer(playerId: PlayerId): boolean {
    return this.playerIds.has(playerId);
  }

  toSnapshot(): Readonly<TeamSnapshot> {
    return Object.freeze({
      ...this.config,
      playerIds: Object.freeze([...this.playerIds]),
    });
  }
}

function validatePlayerId(playerId: PlayerId): void {
  if (!playerId.trim()) {
    throw new RangeError("player id must not be empty");
  }
}

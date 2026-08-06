import type { PlayerId } from "../../core/types/player";
import type {
  TeamId,
  TeamReference,
  TeamResolver,
} from "../../core/types/team";
import { TeamModel } from "./TeamModel";
import { DEFAULT_TEAMS, type TeamConfig, type TeamSnapshot } from "./types";

export {
  BLUE_TEAM_COLOR,
  BLUE_TEAM_ID,
  DEFAULT_TEAMS,
  RED_TEAM_COLOR,
  RED_TEAM_ID,
} from "./types";
export type { TeamConfig, TeamSnapshot } from "./types";

export class TeamManager implements TeamResolver {
  private readonly teams = new Map<TeamId, TeamModel>();
  private readonly teamIdsByPlayer = new Map<PlayerId, TeamId>();

  constructor(configs: ReadonlyArray<TeamConfig> = DEFAULT_TEAMS) {
    for (const config of configs) {
      if (this.teams.has(config.id)) {
        throw new RangeError(`Duplicate team id: ${config.id}`);
      }
      this.teams.set(config.id, new TeamModel(config));
    }
  }

  registerPlayer(playerId: PlayerId, teamId: TeamId): void {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new RangeError(`Unknown team id: ${teamId}`);
    }

    const previousTeamId = this.teamIdsByPlayer.get(playerId);
    if (previousTeamId === teamId) {
      return;
    }

    if (previousTeamId) {
      this.teams.get(previousTeamId)?.unregisterPlayer(playerId);
    }

    team.registerPlayer(playerId);
    this.teamIdsByPlayer.set(playerId, teamId);
  }

  getPlayerTeam(playerId: PlayerId): Readonly<TeamReference> | null {
    const teamId = this.teamIdsByPlayer.get(playerId);
    const snapshot = teamId ? this.teams.get(teamId)?.toSnapshot() : null;
    if (!snapshot) {
      return null;
    }

    return Object.freeze({
      id: snapshot.id,
      label: snapshot.label,
      color: snapshot.color,
    });
  }

  getTeamSnapshot(teamId: TeamId): Readonly<TeamSnapshot> | null {
    return this.teams.get(teamId)?.toSnapshot() ?? null;
  }

  destroy(): void {
    this.teams.clear();
    this.teamIdsByPlayer.clear();
  }
}

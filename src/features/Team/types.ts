import type { PlayerId } from "../../core/types/player";
import type { TeamId } from "../../core/types/team";

export interface TeamConfig {
  readonly id: TeamId;
  readonly label: string;
  readonly color: number;
}

export interface TeamSnapshot extends TeamConfig {
  readonly playerIds: ReadonlyArray<PlayerId>;
}

export const BLUE_TEAM_ID: TeamId = "blue";
export const RED_TEAM_ID: TeamId = "red";
export const BLUE_TEAM_COLOR = 0x3b82f6;
export const RED_TEAM_COLOR = 0xef4444;

export const DEFAULT_TEAMS: ReadonlyArray<TeamConfig> = Object.freeze([
  {
    id: BLUE_TEAM_ID,
    label: "Blue team",
    color: BLUE_TEAM_COLOR,
  },
  {
    id: RED_TEAM_ID,
    label: "Red team",
    color: RED_TEAM_COLOR,
  },
]);

import type { PlayerId } from "./player";

export type TeamId = string;

export interface TeamReference {
  readonly id: TeamId;
  readonly label: string;
  readonly color: number;
}

export interface TeamResolver {
  getPlayerTeam(playerId: PlayerId): Readonly<TeamReference> | null;
}

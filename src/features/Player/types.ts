import type { PlayerId } from "../../core/types/player";
import type { TeamId } from "../../core/types/team";

export interface PlayerConfig {
  id?: PlayerId;
  label?: string;
  maximumStamina?: number;
  initialStamina?: number;
}

export interface PlayerSelectionOption {
  readonly id: PlayerId;
  readonly label: string;
  readonly teamId: TeamId;
  readonly teamLabel: string;
  readonly teamColor: number;
}

export type PlayerEventMap = {
  "player:select": { playerId: PlayerId };
};

export interface StaminaSnapshot {
  readonly current: number;
  readonly maximum: number;
}

export interface ParentLayoutBounds {
  readonly width: number;
  readonly height: number;
}

export const DEFAULT_MAXIMUM_STAMINA = 100;
export const DEFAULT_PLAYER_ID: PlayerId = "local-player";
export const SECOND_LOCAL_PLAYER_ID: PlayerId = "local-player-2";
export const THIRD_LOCAL_PLAYER_ID: PlayerId = "local-player-3";
export const FOURTH_LOCAL_PLAYER_ID: PlayerId = "local-player-4";

export interface PlayerConfig {
  maximumStamina?: number;
  initialStamina?: number;
}

export interface StaminaSnapshot {
  readonly current: number;
  readonly maximum: number;
}

export interface ParentLayoutBounds {
  readonly width: number;
  readonly height: number;
}

export const DEFAULT_MAXIMUM_STAMINA = 100;

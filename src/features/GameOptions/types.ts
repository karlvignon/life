export type HorizontalAlign = "start" | "center" | "end";
export type VerticalAlign = "start" | "center" | "end";

export interface ParentLayoutBounds {
  width: number;
  height: number;
}

export interface GameOptionsUiLayoutConfig {
  anchor: { x: number; y: number };
  horizontalAlign: HorizontalAlign;
  verticalAlign: VerticalAlign;
  margin?: { x: number; y: number };
}

export interface GameOptionsConfig {
  minSpeed?: number;
  maxSpeed?: number;
  initialSpeed?: number;
  layout?: GameOptionsUiLayoutConfig;
}

export const DEFAULT_MIN_SPEED = 0;
export const DEFAULT_MAX_SPEED = 10;
export const DEFAULT_SPEED = 1;

export const DEFAULT_GAME_OPTIONS_UI_LAYOUT: GameOptionsUiLayoutConfig = {
  anchor: { x: 0, y: 1 },
  horizontalAlign: "start",
  verticalAlign: "end",
  margin: { x: 12, y: 12 },
};

import type { Essence, Pattern } from "../MapManager/main";

export type EssenceId = "game-of-life" | "high-life" | "static" | "mushroom";

export interface EssenceDefinition {
  id: EssenceId;
  label: string;
  essence: Essence;
}

export type PatternId =
  | "genesis"
  | "glider"
  | "lwss"
  | "mwss"
  | "blinker"
  | "toad"
  | "replicator"
  | "cell";

export interface PatternDefinition {
  id: PatternId;
  label: string;
  createPattern: (essence: Essence) => Pattern;
}

export type CellCreatorEventMap = {
  "pattern:select": { patternId: PatternId };
  "essence:select": { essenceId: EssenceId };
  "map:clear": void;
};

export interface ParentLayoutBounds {
  width: number;
  height: number;
}

export interface CreateButtonsUiLayoutConfig {
  marginBottom?: number;
  buttonGap?: number;
}

export const DEFAULT_CREATE_BUTTONS_UI_LAYOUT: CreateButtonsUiLayoutConfig = {
  marginBottom: 12,
  buttonGap: 8,
};

export const PREVIEW_OPACITY = 0.4;

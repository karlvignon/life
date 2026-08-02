import type { Placeable } from "../MapManager/main";

export type CellCreatorEventMap = {
  "placeable:select": { placeable: Placeable };
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

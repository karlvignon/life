import type { Essence } from "../MapManager/main";
import type { CardId, EssenceId } from "../../core/types/cards";

export type { CardId, EssenceId, PatternId } from "../../core/types/cards";

export interface EssenceDefinition {
  id: EssenceId;
  label: string;
  essence: Essence;
}

export type CellCreatorEventMap = {
  "card:select": { cardId: CardId };
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

import type { Essence } from "../MapManager/main";
import type { CardId, EssenceFamilyId } from "../../core/types/cards";
import { GAME_COMMANDS } from "../../core/controls";

export { BehaviorInheritanceScore } from "../../core/types/cards";

export type {
  CardId,
  EssenceFamilyId,
  EssenceId,
  PatternId,
} from "../../core/types/cards";

export interface EssenceDefinition {
  id: EssenceFamilyId;
  label: string;
  essence: Essence;
}

export type CellCreatorEventMap = {
  "card:select": { cardId: CardId };
  "essence:select": { essenceId: EssenceFamilyId };
  [GAME_COMMANDS.rotatePlacementClockwise]: void;
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

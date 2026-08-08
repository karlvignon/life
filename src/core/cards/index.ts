import type {
  CardDefinition,
  CardId,
  CardPatternId,
  EssenceCatalogEntry,
  EssenceFamilyId,
  PatternId,
} from "../types/cards";
import { GAME_OF_LIFE_START_CARD } from "./game-of-life/start";
import { GAME_OF_LIFE_GENESIS_CARD } from "./game-of-life/genesis";
import { GAME_OF_LIFE_GLIDER_CARD } from "./game-of-life/glider";
import { GAME_OF_LIFE_LWSS_CARD } from "./game-of-life/lwss";
import { GAME_OF_LIFE_MWSS_CARD } from "./game-of-life/mwss";
import { GAME_OF_LIFE_BLINKER_CARD } from "./game-of-life/blinker";
import { GAME_OF_LIFE_TOAD_CARD } from "./game-of-life/toad";
import { GAME_OF_LIFE_REPLICATOR_CARD } from "./game-of-life/replicator";
import { GAME_OF_LIFE_CELL_CARD } from "./game-of-life/cell";
import { HIGH_LIFE_START_CARD } from "./high-life/start";
import { HIGH_LIFE_GENESIS_CARD } from "./high-life/genesis";
import { HIGH_LIFE_GLIDER_CARD } from "./high-life/glider";
import { HIGH_LIFE_LWSS_CARD } from "./high-life/lwss";
import { HIGH_LIFE_MWSS_CARD } from "./high-life/mwss";
import { HIGH_LIFE_BLINKER_CARD } from "./high-life/blinker";
import { HIGH_LIFE_TOAD_CARD } from "./high-life/toad";
import { HIGH_LIFE_REPLICATOR_CARD } from "./high-life/replicator";
import { HIGH_LIFE_CELL_CARD } from "./high-life/cell";
import { STATIC_START_CARD } from "./static/start";
import { STATIC_CELL_CARD } from "./static/cell";
import { MUSHROOM_START_CARD } from "./mushroom/start";
import { MUSHROOM_CELL_CARD } from "./mushroom/cell";
import { VITALITY_MUSHROOM_CARD } from "./mushroom/vitality-mushroom";
import { MUSHROOM_HORIZONTAL_LINE_CARD } from "./mushroom/horizontal-line";
import { MUSHROOM_BIRTH_CARD } from "./mushroom/mushroom-birth";
import { MUSHROOM_SPROUT_CARD } from "./mushroom/mushroom-sprout";
import { FLORA_START_CARD } from "./flora/start";
import { FLORA_CELL_CARD } from "./flora/cell";
import { FLORA_BIRTH_CARD } from "./flora/flora-birth";
import { TREE_START_CARD } from "./tree/start";
import { TREE_CELL_CARD } from "./tree/cell";
import { TREE_FIVE_CELL_CROSS_CARD } from "./tree/five-cell-cross";
import { TREE_BIRTH_CARD } from "./tree/tree-birth";

export const ESSENCE_DEFINITIONS: ReadonlyArray<EssenceCatalogEntry> =
  Object.freeze([
    { id: "game-of-life", label: "Conway", defaultEssenceId: "game-of-life" },
    { id: "high-life", label: "HighLife", defaultEssenceId: "high-life" },
    { id: "static", label: "Static", defaultEssenceId: "static" },
    { id: "mushroom", label: "Mushroom", defaultEssenceId: "mushroom" },
    { id: "flora", label: "Flora", defaultEssenceId: "flora" },
    { id: "tree", label: "Tree", defaultEssenceId: "tree" },
  ]);

export const DEFAULT_CARD_SEED_RANGE_VALUE = 3;

/** Catalogue métier ordonné des cartes déclarées dans les dossiers de famille. */
export const CARD_DEFINITIONS: ReadonlyArray<CardDefinition> = Object.freeze([
  GAME_OF_LIFE_START_CARD,
  GAME_OF_LIFE_GENESIS_CARD,
  GAME_OF_LIFE_GLIDER_CARD,
  GAME_OF_LIFE_LWSS_CARD,
  GAME_OF_LIFE_MWSS_CARD,
  GAME_OF_LIFE_BLINKER_CARD,
  GAME_OF_LIFE_TOAD_CARD,
  GAME_OF_LIFE_REPLICATOR_CARD,
  GAME_OF_LIFE_CELL_CARD,
  HIGH_LIFE_START_CARD,
  HIGH_LIFE_GENESIS_CARD,
  HIGH_LIFE_GLIDER_CARD,
  HIGH_LIFE_LWSS_CARD,
  HIGH_LIFE_MWSS_CARD,
  HIGH_LIFE_BLINKER_CARD,
  HIGH_LIFE_TOAD_CARD,
  HIGH_LIFE_REPLICATOR_CARD,
  HIGH_LIFE_CELL_CARD,
  STATIC_START_CARD,
  STATIC_CELL_CARD,
  MUSHROOM_START_CARD,
  MUSHROOM_CELL_CARD,
  VITALITY_MUSHROOM_CARD,
  MUSHROOM_HORIZONTAL_LINE_CARD,
  MUSHROOM_BIRTH_CARD,
  MUSHROOM_SPROUT_CARD,
  FLORA_START_CARD,
  FLORA_CELL_CARD,
  FLORA_BIRTH_CARD,
  TREE_START_CARD,
  TREE_CELL_CARD,
  TREE_FIVE_CELL_CROSS_CARD,
  TREE_BIRTH_CARD,
]);

export function createCardId(
  familyId: EssenceFamilyId,
  patternId: CardPatternId,
): CardId {
  return `${familyId}:${patternId}`;
}

export function getCardDefinition(
  familyId: EssenceFamilyId,
  patternId: PatternId,
): CardDefinition | undefined {
  return CARD_DEFINITIONS.find(
    (definition) =>
      definition.familyId === familyId && definition.patternId === patternId,
  );
}

import type {
  CardDefinition,
  CardId,
  CardPatternId,
  EssenceCatalogEntry,
  EssenceId,
  PatternId,
} from "./types/cards";

export const ESSENCE_DEFINITIONS: ReadonlyArray<EssenceCatalogEntry> = [
  { id: "game-of-life", label: "Conway" },
  { id: "high-life", label: "HighLife" },
  { id: "static", label: "Static" },
  { id: "mushroom", label: "Mushroom" },
  { id: "tree", label: "Tree" },
];

/** Catalogue métier exhaustif des combinaisons essence / motif plaçables. */
export const CARD_DEFINITIONS: ReadonlyArray<CardDefinition> = [
  { essenceId: "game-of-life", patternId: "genesis", label: "Genesis" },
  { essenceId: "game-of-life", patternId: "glider", label: "Glider" },
  { essenceId: "game-of-life", patternId: "lwss", label: "LWSS" },
  { essenceId: "game-of-life", patternId: "mwss", label: "MWSS" },
  { essenceId: "game-of-life", patternId: "blinker", label: "Blinker" },
  { essenceId: "game-of-life", patternId: "toad", label: "Toad" },
  {
    essenceId: "game-of-life",
    patternId: "replicator",
    label: "Replicator",
  },
  { essenceId: "game-of-life", patternId: "cell", label: "Cell" },
  { essenceId: "high-life", patternId: "genesis", label: "Genesis" },
  { essenceId: "high-life", patternId: "glider", label: "Glider" },
  { essenceId: "high-life", patternId: "lwss", label: "LWSS" },
  { essenceId: "high-life", patternId: "mwss", label: "MWSS" },
  { essenceId: "high-life", patternId: "blinker", label: "Blinker" },
  { essenceId: "high-life", patternId: "toad", label: "Toad" },
  {
    essenceId: "high-life",
    patternId: "replicator",
    label: "Replicator",
  },
  { essenceId: "high-life", patternId: "cell", label: "Cell" },
  { essenceId: "static", patternId: "cell", label: "Cell" },
  { essenceId: "mushroom", patternId: "cell", label: "Cell" },
  {
    essenceId: "mushroom",
    patternId: "horizontal-line",
    label: "Horizontal line",
  },
  { essenceId: "tree", patternId: "cell", label: "Cell" },
  {
    essenceId: "tree",
    patternId: "five-cell-cross",
    label: "5-cell cross",
  },
];

export function createCardId(
  essenceId: EssenceId,
  patternId: CardPatternId,
): CardId {
  return `${essenceId}:${patternId}`;
}

export function getCardDefinition(
  essenceId: EssenceId,
  patternId: PatternId,
): CardDefinition | undefined {
  return CARD_DEFINITIONS.find(
    (definition) =>
      definition.essenceId === essenceId && definition.patternId === patternId,
  );
}

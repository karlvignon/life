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
  {
    essenceId: "game-of-life",
    patternId: "genesis",
    label: "Genesis",
    staminaCost: 30,
  },
  {
    essenceId: "game-of-life",
    patternId: "glider",
    label: "Glider",
    staminaCost: 50,
  },
  {
    essenceId: "game-of-life",
    patternId: "lwss",
    label: "LWSS",
    staminaCost: 90,
  },
  {
    essenceId: "game-of-life",
    patternId: "mwss",
    label: "MWSS",
    staminaCost: 30,
  },
  {
    essenceId: "game-of-life",
    patternId: "blinker",
    label: "Blinker",
    staminaCost: 30,
  },
  {
    essenceId: "game-of-life",
    patternId: "toad",
    label: "Toad",
    staminaCost: 60,
  },
  {
    essenceId: "game-of-life",
    patternId: "replicator",
    label: "Replicator",
    staminaCost: 100,
  },
  {
    essenceId: "game-of-life",
    patternId: "cell",
    label: "Cell",
    staminaCost: 10,
  },
  {
    essenceId: "high-life",
    patternId: "genesis",
    label: "Genesis",
    staminaCost: 30,
  },
  {
    essenceId: "high-life",
    patternId: "glider",
    label: "Glider",
    staminaCost: 50,
  },
  { essenceId: "high-life", patternId: "lwss", label: "LWSS", staminaCost: 90 },
  { essenceId: "high-life", patternId: "mwss", label: "MWSS", staminaCost: 30 },
  {
    essenceId: "high-life",
    patternId: "blinker",
    label: "Blinker",
    staminaCost: 30,
  },
  { essenceId: "high-life", patternId: "toad", label: "Toad", staminaCost: 6 },
  {
    essenceId: "high-life",
    patternId: "replicator",
    label: "Replicator",
    staminaCost: 100,
  },
  { essenceId: "high-life", patternId: "cell", label: "Cell", staminaCost: 1 },
  { essenceId: "static", patternId: "cell", label: "Cell", staminaCost: 1 },
  { essenceId: "mushroom", patternId: "cell", label: "Cell", staminaCost: 1 },
  {
    essenceId: "mushroom",
    patternId: "horizontal-line",
    label: "Horizontal line",
    staminaCost: 30,
  },
  { essenceId: "tree", patternId: "cell", label: "Cell", staminaCost: 1 },
  {
    essenceId: "tree",
    patternId: "five-cell-cross",
    label: "5-cell cross",
    staminaCost: 50,
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

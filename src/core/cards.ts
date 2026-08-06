import type {
  CardDefinition,
  CardId,
  CardPatternId,
  EssenceCatalogEntry,
  EssenceFamilyId,
  PatternId,
} from "./types/cards";

export const ESSENCE_DEFINITIONS: ReadonlyArray<EssenceCatalogEntry> = [
  { id: "game-of-life", label: "Conway", defaultEssenceId: "game-of-life" },
  { id: "high-life", label: "HighLife", defaultEssenceId: "high-life" },
  { id: "static", label: "Static", defaultEssenceId: "static" },
  { id: "mushroom", label: "Mushroom", defaultEssenceId: "mushroom" },
  { id: "flora", label: "Flora", defaultEssenceId: "flora" },
  { id: "tree", label: "Tree", defaultEssenceId: "tree" },
];

/** Catalogue métier exhaustif des combinaisons essence / motif plaçables. */
export const CARD_DEFINITIONS: ReadonlyArray<CardDefinition> = [
  {
    familyId: "game-of-life",
    patternId: "genesis",
    label: "Genesis",
    staminaCost: 30,
  },
  {
    familyId: "game-of-life",
    patternId: "glider",
    label: "Glider",
    staminaCost: 50,
  },
  {
    familyId: "game-of-life",
    patternId: "lwss",
    label: "LWSS",
    staminaCost: 90,
  },
  {
    familyId: "game-of-life",
    patternId: "mwss",
    label: "MWSS",
    staminaCost: 30,
  },
  {
    familyId: "game-of-life",
    patternId: "blinker",
    label: "Blinker",
    staminaCost: 30,
  },
  {
    familyId: "game-of-life",
    patternId: "toad",
    label: "Toad",
    staminaCost: 60,
  },
  {
    familyId: "game-of-life",
    patternId: "replicator",
    label: "Replicator",
    staminaCost: 100,
  },
  {
    familyId: "game-of-life",
    patternId: "cell",
    label: "Cell",
    staminaCost: 10,
  },
  {
    familyId: "high-life",
    patternId: "genesis",
    label: "Genesis",
    staminaCost: 30,
  },
  {
    familyId: "high-life",
    patternId: "glider",
    label: "Glider",
    staminaCost: 50,
  },
  { familyId: "high-life", patternId: "lwss", label: "LWSS", staminaCost: 90 },
  { familyId: "high-life", patternId: "mwss", label: "MWSS", staminaCost: 30 },
  {
    familyId: "high-life",
    patternId: "blinker",
    label: "Blinker",
    staminaCost: 30,
  },
  { familyId: "high-life", patternId: "toad", label: "Toad", staminaCost: 6 },
  {
    familyId: "high-life",
    patternId: "replicator",
    label: "Replicator",
    staminaCost: 100,
  },
  { familyId: "high-life", patternId: "cell", label: "Cell", staminaCost: 1 },
  { familyId: "static", patternId: "cell", label: "Cell", staminaCost: 1 },
  { familyId: "mushroom", patternId: "cell", label: "Cell", staminaCost: 1 },
  {
    familyId: "mushroom",
    patternId: "horizontal-line",
    label: "Horizontal line",
    staminaCost: 30,
  },
  {
    familyId: "mushroom",
    patternId: "mushroom-birth",
    label: "Birth pattern",
    staminaCost: 40,
  },
  {
    familyId: "mushroom",
    essenceId: "mushroom-sprout",
    patternId: "mushroom-sprout",
    label: "Sprout",
    staminaCost: 20,
  },
  { familyId: "flora", patternId: "cell", label: "Cell", staminaCost: 1 },
  {
    familyId: "flora",
    patternId: "flora-birth",
    label: "Birth pattern",
    staminaCost: 80,
  },
  { familyId: "tree", patternId: "cell", label: "Cell", staminaCost: 1 },
  {
    familyId: "tree",
    patternId: "five-cell-cross",
    label: "5-cell cross",
    staminaCost: 50,
  },
  {
    familyId: "tree",
    patternId: "tree-birth",
    label: "Birth pattern",
    staminaCost: 40,
  },
];

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

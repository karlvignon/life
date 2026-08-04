export type EssenceId =
  "game-of-life" | "high-life" | "static" | "mushroom" | "tree";

export type PatternId =
  | "genesis"
  | "glider"
  | "lwss"
  | "mwss"
  | "blinker"
  | "toad"
  | "replicator"
  | "cell"
  | "horizontal-line"
  | "five-cell-cross"
  | "rle";

export type CardPatternId = Exclude<PatternId, "rle">;
export type CardId = `${EssenceId}:${CardPatternId}`;

export interface EssenceCatalogEntry {
  readonly id: EssenceId;
  readonly label: string;
}

export interface CardDefinition {
  readonly essenceId: EssenceId;
  readonly patternId: CardPatternId;
  readonly label: string;
  readonly staminaCost: number;
}

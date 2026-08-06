/** Identifiants ouverts, validés par les catalogues au bootstrap. */
export type EssenceId = string;
export type EssenceFamilyId = string;
export type PatternId = string;
export type CardPatternId = string;
export type CardId = string;

export interface EssenceCatalogEntry {
  readonly id: EssenceFamilyId;
  readonly label: string;
  readonly defaultEssenceId: EssenceId;
}

export interface CardDefinition {
  readonly familyId: EssenceFamilyId;
  /** Variante concrète ; utilise celle de la famille quand elle est absente. */
  readonly essenceId?: EssenceId;
  readonly patternId: CardPatternId;
  readonly label: string;
  readonly staminaCost: number;
}

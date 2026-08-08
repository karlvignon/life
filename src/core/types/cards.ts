/** Identifiants ouverts, validés par les catalogues au bootstrap. */
export type EssenceId = string;
export type EssenceFamilyId = string;
export type PatternId = string;
export type CardPatternId = string;
export type CardId = string;

/** Valeurs réservées d'un budget de transmission de behavior. */
export enum BehaviorInheritanceScore {
  INFINITE = -1,
  NONE = 0,
}

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
  readonly behaviors?: ReadonlyArray<CardBehaviorDefinition>;
}

export type CardBehaviorDefinition =
  | {
      readonly type: "seed-range";
      readonly value: number;
    }
  | {
      readonly type: "blind-seeding";
    }
  | {
      readonly type: "lifecycle-effects";
      readonly id: string;
      /** -1 : infini, 0 : non transmissible, n > 0 : n générations. */
      readonly inheritableScore: number;
      readonly onBirth?: ReadonlyArray<CardMapEffectDefinition>;
      readonly onCycle?: {
        readonly every?: number;
        readonly effects: ReadonlyArray<CardMapEffectDefinition>;
      };
      readonly onDeath?: ReadonlyArray<CardMapEffectDefinition>;
    };

export interface RelativeCardEffectTarget {
  readonly offsetX: number;
  readonly offsetY: number;
}

export type CardMapEffectDefinition =
  | {
      readonly type: "spawn-essence";
      readonly target: RelativeCardEffectTarget;
      readonly essenceId: EssenceId;
      readonly collision?: "if-empty" | "replace";
    }
  | {
      readonly type: "damage";
      readonly target: RelativeCardEffectTarget;
      readonly amount: number;
    }
  | {
      readonly type: "heal";
      readonly target: RelativeCardEffectTarget;
      readonly amount: number;
    }
  | {
      readonly type: "tile-data:add";
      readonly target: RelativeCardEffectTarget;
      readonly property: "life" | "maximumLife" | "reproducibility";
      readonly value: number;
    }
  | {
      readonly type: "modifier:add";
      readonly target: RelativeCardEffectTarget;
      readonly key: string;
      readonly property: "degrees" | "windStrength";
      readonly mode: "absolute" | "proportional";
      readonly value: number;
      readonly lifetime?:
        | { readonly type: "while-source-alive" }
        | { readonly type: "cycles"; readonly duration: number }
        | { readonly type: "permanent" };
    }
  | {
      readonly type: "modifier:remove";
      readonly target: RelativeCardEffectTarget;
      readonly key: string;
      readonly source?: "self" | "any";
    };

import { createCardId } from "../../core/cards";
import type { Essence, Pattern, TileBehavior } from "../MapManager/main";
import type { CardId, EssenceFamilyId } from "./types";

export interface CardConfig {
  readonly familyId: EssenceFamilyId;
  readonly label: string;
  readonly staminaCost: number;
  readonly pattern: Pattern;
  readonly essence: Essence;
  readonly behaviors?: ReadonlyArray<TileBehavior>;
}

/** Carte résolue depuis une définition déclarative et les catalogues. */
export class Card {
  readonly pattern: Pattern;
  readonly essence: Essence;
  readonly behaviors: ReadonlyArray<TileBehavior>;
  private readonly config: Omit<CardConfig, "behaviors">;

  constructor(config: CardConfig) {
    this.config = config;
    this.pattern = config.pattern;
    this.essence = config.essence;
    const behaviors = config.behaviors ?? [];

    const behaviorIds = new Set<string>();
    for (const behavior of behaviors) {
      if (!behavior.id.trim() || behaviorIds.has(behavior.id)) {
        throw new RangeError(
          `Card ${config.familyId} behavior ids must be unique and non-empty`,
        );
      }
      behaviorIds.add(behavior.id);
    }
    this.behaviors = Object.freeze([...behaviors]);
  }

  get label(): string {
    return this.config.label;
  }

  get familyId(): EssenceFamilyId {
    return this.config.familyId;
  }

  get staminaCost(): number {
    return this.config.staminaCost;
  }

  get id(): CardId {
    return createCardId(this.config.familyId, this.pattern.id);
  }
}

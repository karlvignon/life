import { createCardId } from "../../core/cards";
import type { CardDefinition } from "../../core/types/cards";
import type { Essence, Pattern } from "../MapManager/main";
import type { CardId, EssenceFamilyId } from "./types";

/** Carte résolue depuis une définition déclarative et les catalogues. */
export class Card {
  constructor(
    private readonly definition: CardDefinition,
    readonly pattern: Pattern,
    readonly essence: Essence,
  ) {
    if (pattern.id !== definition.patternId) {
      throw new Error(
        `Card ${definition.familyId} expected pattern ${definition.patternId}, got ${pattern.id}`,
      );
    }
    if (definition.essenceId && essence.id !== definition.essenceId) {
      throw new Error(
        `Card ${definition.familyId} expected essence ${definition.essenceId}, got ${essence.id}`,
      );
    }
  }

  get label(): string {
    return this.definition.label;
  }

  get familyId(): EssenceFamilyId {
    return this.definition.familyId;
  }

  get staminaCost(): number {
    return this.definition.staminaCost;
  }

  get id(): CardId {
    return createCardId(this.definition.familyId, this.definition.patternId);
  }
}

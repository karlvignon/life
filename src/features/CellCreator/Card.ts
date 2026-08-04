import { createCardId, getCardDefinition } from "../../core/cards";
import type { CardDefinition } from "../../core/types/cards";
import type { Essence, Pattern } from "../MapManager/main";
import type { CardId, EssenceId } from "./types";

/** Choix plaçable associant explicitement un motif à son essence. */
export class Card {
  private readonly definition: CardDefinition;

  constructor(
    readonly pattern: Pattern,
    readonly essence: Essence,
  ) {
    const definition = getCardDefinition(essence.id, pattern.id);
    if (!definition) {
      throw new Error(`Unknown card combination: ${essence.id}:${pattern.id}`);
    }

    this.definition = definition;
  }

  get label(): string {
    return this.definition.label;
  }

  get essenceId(): EssenceId {
    return this.definition.essenceId;
  }

  get staminaCost(): number {
    return this.definition.staminaCost;
  }

  get id(): CardId {
    return createCardId(this.definition.essenceId, this.definition.patternId);
  }
}

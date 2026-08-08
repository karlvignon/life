import type { CardDefinition } from "../../core/types/cards";
import {
  createPattern,
  createTileBehaviors,
  essenceCatalog,
} from "../MapManager/main";
import { Card } from "./Card";
import type { EssenceDefinition, EssenceFamilyId } from "./types";

/** Résout une définition déclarative en carte prête à être utilisée. */
export class CardFactory {
  private readonly familiesById: ReadonlyMap<
    EssenceFamilyId,
    EssenceDefinition
  >;

  constructor(families: ReadonlyArray<EssenceDefinition>) {
    const familiesById = new Map<EssenceFamilyId, EssenceDefinition>();
    for (const family of families) {
      if (familiesById.has(family.id)) {
        throw new RangeError(`Duplicate essence family: ${family.id}`);
      }
      familiesById.set(family.id, family);
    }
    this.familiesById = familiesById;
  }

  create(definition: CardDefinition): Card {
    const family = this.familiesById.get(definition.familyId);
    if (!family) {
      throw new Error(`Unknown essence family: ${definition.familyId}`);
    }

    return new Card({
      familyId: definition.familyId,
      label: definition.label,
      staminaCost: definition.staminaCost,
      pattern: createPattern(definition.patternId),
      essence: definition.essenceId
        ? essenceCatalog.get(definition.essenceId)
        : family.essence,
      behaviors: createTileBehaviors(definition.behaviors ?? []),
    });
  }
}

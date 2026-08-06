import {
  CARD_DEFINITIONS,
  ESSENCE_DEFINITIONS as CORE_ESSENCE_DEFINITIONS,
} from "../../core/cards";
import { essenceCatalog, createPattern } from "../MapManager/main";
import { Card } from "./Card";
import type { CardId, EssenceDefinition, EssenceFamilyId } from "./types";

export const ESSENCE_DEFINITIONS: ReadonlyArray<EssenceDefinition> =
  CORE_ESSENCE_DEFINITIONS.map((definition) => ({
    id: definition.id,
    label: definition.label,
    essence: essenceCatalog.get(definition.defaultEssenceId),
  }));

export const DEFAULT_ESSENCE_DEFINITION = ESSENCE_DEFINITIONS[0]!;

function getRequiredEssenceDefinition(
  familyId: EssenceFamilyId,
): EssenceDefinition {
  const definition = ESSENCE_DEFINITIONS.find(({ id }) => id === familyId);
  if (!definition) {
    throw new Error(`Unknown essence family: ${familyId}`);
  }
  return definition;
}

export const CARDS: ReadonlyArray<Card> = CARD_DEFINITIONS.map((definition) => {
  const family = getRequiredEssenceDefinition(definition.familyId);
  const concreteEssenceId = definition.essenceId ?? family.essence.id;
  return new Card(
    definition,
    createPattern(definition.patternId),
    essenceCatalog.get(concreteEssenceId),
  );
});

validateResolvedCards(CARDS);

export function getEssenceDefinition(
  familyId: EssenceFamilyId,
): EssenceDefinition | undefined {
  return ESSENCE_DEFINITIONS.find(({ id }) => id === familyId);
}

export function getCard(cardId: CardId): Card | undefined {
  return CARDS.find(({ id }) => id === cardId);
}

export function getCardsForEssence(
  familyId: EssenceFamilyId,
): ReadonlyArray<Card> {
  return CARDS.filter((card) => card.familyId === familyId);
}

function validateResolvedCards(cards: ReadonlyArray<Card>): void {
  const ids = new Set<CardId>();
  for (const card of cards) {
    if (ids.has(card.id)) {
      throw new RangeError(`Duplicate card id: ${card.id}`);
    }
    if (!Number.isFinite(card.staminaCost) || card.staminaCost <= 0) {
      throw new RangeError(`Invalid stamina cost for card: ${card.id}`);
    }
    ids.add(card.id);
  }
}

import {
  CARD_DEFINITIONS,
  ESSENCE_DEFINITIONS as CORE_ESSENCE_DEFINITIONS,
} from "../../core/cards";
import { createEssence, createPattern } from "../MapManager/main";
import { Card } from "./Card";
import type { CardId, EssenceDefinition, EssenceId } from "./types";

export const ESSENCE_DEFINITIONS: ReadonlyArray<EssenceDefinition> =
  CORE_ESSENCE_DEFINITIONS.map((definition) => ({
    ...definition,
    essence: createEssence(definition.id),
  }));

export const DEFAULT_ESSENCE_DEFINITION = ESSENCE_DEFINITIONS[0]!;

function getRequiredEssenceDefinition(essenceId: EssenceId): EssenceDefinition {
  const definition = ESSENCE_DEFINITIONS.find(({ id }) => id === essenceId);

  if (!definition) {
    throw new Error(`Unknown essence: ${essenceId}`);
  }

  return definition;
}

export const CARDS: ReadonlyArray<Card> = CARD_DEFINITIONS.map((definition) => {
  const essence = getRequiredEssenceDefinition(definition.essenceId).essence;
  const pattern = createPattern(definition.patternId);

  return new Card(pattern, essence);
});

export function getEssenceDefinition(
  essenceId: EssenceId,
): EssenceDefinition | undefined {
  return ESSENCE_DEFINITIONS.find(({ id }) => id === essenceId);
}

export function getCard(cardId: CardId): Card | undefined {
  return CARDS.find(({ id }) => id === cardId);
}

export function getCardsForEssence(essenceId: EssenceId): ReadonlyArray<Card> {
  return CARDS.filter((card) => card.essenceId === essenceId);
}

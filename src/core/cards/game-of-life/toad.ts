import type { CardDefinition } from "../../types/cards";

export const GAME_OF_LIFE_TOAD_CARD = Object.freeze({
  familyId: "game-of-life",
  patternId: "toad",
  label: "Toad",
  staminaCost: 60,
  behaviors: Object.freeze([{ type: "seed-range" as const, value: 3 }]),
}) satisfies CardDefinition;

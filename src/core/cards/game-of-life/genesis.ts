import type { CardDefinition } from "../../types/cards";

export const GAME_OF_LIFE_GENESIS_CARD = Object.freeze({
  familyId: "game-of-life",
  patternId: "genesis",
  label: "Genesis",
  staminaCost: 30,
  behaviors: Object.freeze([{ type: "seed-range" as const, value: 3 }]),
}) satisfies CardDefinition;

import type { CardDefinition } from "../../types/cards";

export const GAME_OF_LIFE_REPLICATOR_CARD = Object.freeze({
  familyId: "game-of-life",
  patternId: "replicator",
  label: "Replicator",
  staminaCost: 100,
  behaviors: Object.freeze([{ type: "seed-range" as const, value: 3 }]),
}) satisfies CardDefinition;

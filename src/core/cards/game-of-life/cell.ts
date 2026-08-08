import type { CardDefinition } from "../../types/cards";

export const GAME_OF_LIFE_CELL_CARD = Object.freeze({
  familyId: "game-of-life",
  patternId: "cell",
  label: "Cell",
  staminaCost: 10,
  behaviors: Object.freeze([{ type: "seed-range" as const, value: 3 }]),
}) satisfies CardDefinition;

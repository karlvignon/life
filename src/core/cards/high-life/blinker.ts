import type { CardDefinition } from "../../types/cards";

export const HIGH_LIFE_BLINKER_CARD = Object.freeze({
  familyId: "high-life",
  patternId: "blinker",
  label: "Blinker",
  staminaCost: 30,
  behaviors: Object.freeze([{ type: "seed-range" as const, value: 3 }]),
}) satisfies CardDefinition;

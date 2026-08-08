import type { CardDefinition } from "../../types/cards";

export const HIGH_LIFE_TOAD_CARD = Object.freeze({
  familyId: "high-life",
  patternId: "toad",
  label: "Toad",
  staminaCost: 6,
  behaviors: Object.freeze([{ type: "seed-range" as const, value: 3 }]),
}) satisfies CardDefinition;

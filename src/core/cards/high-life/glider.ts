import type { CardDefinition } from "../../types/cards";

export const HIGH_LIFE_GLIDER_CARD = Object.freeze({
  familyId: "high-life",
  patternId: "glider",
  label: "Glider",
  staminaCost: 50,
  behaviors: Object.freeze([{ type: "seed-range" as const, value: 3 }]),
}) satisfies CardDefinition;

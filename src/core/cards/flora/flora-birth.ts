import type { CardDefinition } from "../../types/cards";

export const FLORA_BIRTH_CARD = Object.freeze({
  familyId: "flora",
  patternId: "flora-birth",
  label: "Birth pattern",
  staminaCost: 80,
  behaviors: Object.freeze([{ type: "seed-range" as const, value: 3 }]),
}) satisfies CardDefinition;

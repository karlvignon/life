import type { CardDefinition } from "../../types/cards";

export const MUSHROOM_BIRTH_CARD = Object.freeze({
  familyId: "mushroom",
  patternId: "mushroom-birth",
  label: "Birth pattern",
  staminaCost: 40,
  behaviors: Object.freeze([{ type: "seed-range" as const, value: 3 }]),
}) satisfies CardDefinition;

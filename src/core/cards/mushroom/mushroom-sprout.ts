import type { CardDefinition } from "../../types/cards";

export const MUSHROOM_SPROUT_CARD = Object.freeze({
  familyId: "mushroom",
  essenceId: "mushroom-sprout",
  patternId: "mushroom-sprout",
  label: "Sprout",
  staminaCost: 20,
  behaviors: Object.freeze([{ type: "seed-range" as const, value: 3 }]),
}) satisfies CardDefinition;

import type { CardDefinition } from "../../types/cards";

export const MUSHROOM_START_CARD = Object.freeze({
  familyId: "mushroom",
  patternId: "start",
  label: "START",
  staminaCost: 1,
  behaviors: Object.freeze([
    { type: "seed-range" as const, value: 4 },
    { type: "blind-seeding" as const },
  ]),
}) satisfies CardDefinition;

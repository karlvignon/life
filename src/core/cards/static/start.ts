import type { CardDefinition } from "../../types/cards";

export const STATIC_START_CARD = Object.freeze({
  familyId: "static",
  patternId: "start",
  label: "START",
  staminaCost: 1,
  behaviors: Object.freeze([
    { type: "seed-range" as const, value: 4 },
    { type: "blind-seeding" as const },
  ]),
}) satisfies CardDefinition;

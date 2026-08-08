import type { CardDefinition } from "../../types/cards";

export const HIGH_LIFE_LWSS_CARD = Object.freeze({
  familyId: "high-life",
  patternId: "lwss",
  label: "LWSS",
  staminaCost: 90,
  behaviors: Object.freeze([{ type: "seed-range" as const, value: 3 }]),
}) satisfies CardDefinition;

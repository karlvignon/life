import type { CardDefinition } from "../../types/cards";

export const MUSHROOM_HORIZONTAL_LINE_CARD = Object.freeze({
  familyId: "mushroom",
  patternId: "horizontal-line",
  label: "Horizontal line",
  staminaCost: 30,
  behaviors: Object.freeze([{ type: "seed-range" as const, value: 3 }]),
}) satisfies CardDefinition;

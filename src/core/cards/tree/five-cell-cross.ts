import type { CardDefinition } from "../../types/cards";

export const TREE_FIVE_CELL_CROSS_CARD = Object.freeze({
  familyId: "tree",
  patternId: "five-cell-cross",
  label: "5-cell cross",
  staminaCost: 50,
  behaviors: Object.freeze([{ type: "seed-range" as const, value: 3 }]),
}) satisfies CardDefinition;

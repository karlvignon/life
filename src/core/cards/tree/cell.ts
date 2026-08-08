import type { CardDefinition } from "../../types/cards";

export const TREE_CELL_CARD = Object.freeze({
  familyId: "tree",
  patternId: "cell",
  label: "Cell",
  staminaCost: 1,
  behaviors: Object.freeze([{ type: "seed-range" as const, value: 3 }]),
}) satisfies CardDefinition;

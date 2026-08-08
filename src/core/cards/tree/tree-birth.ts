import type { CardDefinition } from "../../types/cards";

export const TREE_BIRTH_CARD = Object.freeze({
  familyId: "tree",
  patternId: "tree-birth",
  label: "Birth pattern",
  staminaCost: 40,
  behaviors: Object.freeze([{ type: "seed-range" as const, value: 3 }]),
}) satisfies CardDefinition;

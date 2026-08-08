import {
  BehaviorInheritanceScore,
  type CardDefinition,
} from "../../types/cards";

export const VITALITY_MUSHROOM_CARD = Object.freeze({
  familyId: "mushroom",
  patternId: "vitality-mushroom",
  label: "VitalityMushroom",
  staminaCost: 1,
  behaviors: Object.freeze([
    { type: "seed-range" as const, value: 3 },
    {
      type: "lifecycle-effects" as const,
      id: "vitality-mushroom-birth",
      inheritableScore: BehaviorInheritanceScore.INFINITE,
      onBirth: Object.freeze(
        [
          { offsetX: -1, offsetY: -1 },
          { offsetX: 0, offsetY: -1 },
          { offsetX: 1, offsetY: -1 },
          { offsetX: -1, offsetY: 0 },
          { offsetX: 1, offsetY: 0 },
          { offsetX: -1, offsetY: 1 },
          { offsetX: 0, offsetY: 1 },
          { offsetX: 1, offsetY: 1 },
        ].map((target) =>
          Object.freeze({
            type: "tile-data:add" as const,
            target: Object.freeze(target),
            property: "reproducibility" as const,
            value: 5,
          }),
        ),
      ),
    },
  ]),
}) satisfies CardDefinition;

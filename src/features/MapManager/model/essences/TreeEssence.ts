import {
  createPatternBirthBehavior,
  type BirthPattern,
} from "../evolution/behaviors/PatternBirthBehavior";
import { Essence, type EssenceDefinition } from "./Essence";
import { BehaviorInheritanceScore } from "../behaviors/TileBehavior";
import { LifecycleEffectsBehavior } from "../behaviors/LifecycleEffectsBehavior";

export const DEFAULT_TREE_COLOR = 0x16a34a;
export const TREE_NEIGHBOR_DEGREES_MODIFIER = -2;

export const TREE_BIRTH_PATTERN: BirthPattern = Object.freeze([
  Object.freeze({ x: -1, y: -1 }),
  Object.freeze({ x: 1, y: -1 }),
  Object.freeze({ x: -1, y: 1 }),
  Object.freeze({ x: 1, y: 1 }),
]);

const TREE_TEMPERATURE_AURA = new LifecycleEffectsBehavior({
  type: "lifecycle-effects",
  id: "tree-temperature-aura",
  inheritableScore: BehaviorInheritanceScore.NONE,
  onBirth: [
    { offsetX: 0, offsetY: -1 },
    { offsetX: 1, offsetY: 0 },
    { offsetX: 0, offsetY: 1 },
    { offsetX: -1, offsetY: 0 },
  ].map((target) => ({
    type: "modifier:add" as const,
    target,
    key: "tree-neighbor-temperature",
    property: "degrees" as const,
    mode: "absolute" as const,
    value: TREE_NEIGHBOR_DEGREES_MODIFIER,
    lifetime: { type: "while-source-alive" as const },
  })),
});

const TREE_EVOLUTION = createPatternBirthBehavior(
  "tree-diagonal-birth",
  TREE_BIRTH_PATTERN,
);

export class TreeEssence extends Essence {
  constructor(
    color: number = DEFAULT_TREE_COLOR,
    overrides: Partial<EssenceDefinition> = {},
  ) {
    super({
      id: "tree",
      name: "Tree",
      color,
      evolutionBehaviors: [TREE_EVOLUTION],
      lifecycleBehaviors: [TREE_TEMPERATURE_AURA],
      ...overrides,
    });
  }

  getBirthPattern(): BirthPattern {
    return TREE_BIRTH_PATTERN;
  }
}

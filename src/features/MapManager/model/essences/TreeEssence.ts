import {
  createPatternBirthBehavior,
  type BirthPattern,
} from "../evolution/behaviors/PatternBirthBehavior";
import {
  Essence,
  type BirthModifierDefinition,
  type EssenceDefinition,
} from "./Essence";

export const DEFAULT_TREE_COLOR = 0x16a34a;
export const TREE_NEIGHBOR_DEGREES_MODIFIER = -2;

export const TREE_BIRTH_PATTERN: BirthPattern = Object.freeze([
  Object.freeze({ x: -1, y: -1 }),
  Object.freeze({ x: 1, y: -1 }),
  Object.freeze({ x: -1, y: 1 }),
  Object.freeze({ x: 1, y: 1 }),
]);

const TEMPERATURE_MODIFIERS: ReadonlyArray<BirthModifierDefinition> =
  Object.freeze(
    [
      { offsetX: 0, offsetY: -1 },
      { offsetX: 1, offsetY: 0 },
      { offsetX: 0, offsetY: 1 },
      { offsetX: -1, offsetY: 0 },
    ].map((offset) =>
      Object.freeze({
        ...offset,
        property: "degrees" as const,
        mode: "absolute" as const,
        value: TREE_NEIGHBOR_DEGREES_MODIFIER,
      }),
    ),
  );

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
      birthModifiers: TEMPERATURE_MODIFIERS,
      ...overrides,
    });
  }

  getBirthPattern(): BirthPattern {
    return TREE_BIRTH_PATTERN;
  }
}

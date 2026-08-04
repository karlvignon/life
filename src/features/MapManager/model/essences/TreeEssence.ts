import type { BirthModifierDefinition } from "./Essence";
import {
  PatternDuplicatorEssence,
  type BirthPattern,
} from "./PatternDuplicatorEssence";

export const DEFAULT_TREE_COLOR = 0x16a34a;
export const TREE_NEIGHBOR_DEGREES_MODIFIER = -2;

/** Quatre arbres en diagonale autour du centre de naissance. */
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

/** Essence immobile qui rafraîchit ses quatre voisines orthogonales. */
export class TreeEssence extends PatternDuplicatorEssence {
  readonly id = "tree";
  readonly name: string = "Tree";

  constructor(color: number = DEFAULT_TREE_COLOR) {
    super(color, TREE_BIRTH_PATTERN);
  }

  override getBirthModifiers(): ReadonlyArray<BirthModifierDefinition> {
    return TEMPERATURE_MODIFIERS;
  }
}

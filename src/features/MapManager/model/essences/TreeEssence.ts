import type { BirthModifierDefinition } from "./Essence";
import { StaticEssence } from "./StaticEssence";

export const DEFAULT_TREE_COLOR = 0x16a34a;
export const TREE_NEIGHBOR_DEGREES_MODIFIER = -2;

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
export class TreeEssence extends StaticEssence {
  override readonly name: string = "Tree";

  constructor(color: number = DEFAULT_TREE_COLOR) {
    super(color);
  }

  override getBirthModifiers(): ReadonlyArray<BirthModifierDefinition> {
    return TEMPERATURE_MODIFIERS;
  }
}

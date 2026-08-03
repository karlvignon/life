import type { WeatherValues } from "../../../../core/types/weather";
import type { Essence } from "../essences/Essence";

export type WeatherProperty = keyof WeatherValues;
export type ModifierMode = "absolute" | "proportional";

export interface ModifierAuthor {
  readonly x: number;
  readonly y: number;
  readonly essence: Essence;
}

export interface ModifierDefinition {
  readonly property: WeatherProperty;
  readonly mode: ModifierMode;
  /**
   * Valeur signée : positive pour une hausse, négative pour une baisse.
   * En mode proportionnel, 0.1 représente +10 % et -0.1 représente -10 %.
   */
  readonly value: number;
}

/** Modifie une propriété météo pour la tuile qui le porte. */
export class Modifier {
  constructor(
    readonly author: ModifierAuthor,
    readonly property: WeatherProperty,
    readonly mode: ModifierMode,
    readonly value: number,
  ) {
    if (!Number.isFinite(value)) {
      throw new RangeError("modifier value must be finite");
    }
  }

  apply(value: number): number {
    return this.mode === "absolute"
      ? value + this.value
      : value * (1 + this.value);
  }

  isAuthoredBy(author: ModifierAuthor): boolean {
    return (
      this.author.x === author.x &&
      this.author.y === author.y &&
      this.author.essence === author.essence
    );
  }
}

export function applyModifiers<T extends Record<WeatherProperty, number>>(
  values: Readonly<T>,
  modifiers: ReadonlyArray<Modifier>,
): Readonly<T> {
  return modifiers.reduce<Readonly<T>>(
    (modifiedValues, modifier) =>
      Object.freeze({
        ...modifiedValues,
        [modifier.property]: modifier.apply(modifiedValues[modifier.property]),
      }),
    values,
  );
}

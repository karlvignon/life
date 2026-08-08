import type { WeatherValues } from "../../../../core/types/weather";
import type { Essence } from "../essences/Essence";
import type { LifecyclePhase } from "../lifecycle/types";

export type WeatherProperty = keyof WeatherValues;
export type ModifierMode = "absolute" | "proportional";

export interface ModifierAuthor {
  readonly x: number;
  readonly y: number;
  readonly essence: Essence;
  readonly lifeId?: string;
  readonly behaviorId?: string;
  readonly phase?: LifecyclePhase;
}

export type ModifierLifetime =
  | { readonly type: "while-source-alive" }
  | { readonly type: "cycles"; readonly duration: number }
  | { readonly type: "permanent" };

export interface ModifierOptions {
  readonly key?: string;
  readonly lifetime?: ModifierLifetime;
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
  readonly key: string;
  readonly lifetime: ModifierLifetime;

  constructor(
    readonly author: ModifierAuthor,
    readonly property: WeatherProperty,
    readonly mode: ModifierMode,
    readonly value: number,
    options: ModifierOptions = {},
  ) {
    if (!Number.isFinite(value)) {
      throw new RangeError("modifier value must be finite");
    }
    this.key = options.key ?? `${property}:${mode}:${value}`;
    if (!this.key.trim()) {
      throw new RangeError("modifier key must not be empty");
    }
    this.lifetime = options.lifetime ?? { type: "while-source-alive" };
    if (
      this.lifetime.type === "cycles" &&
      (!Number.isSafeInteger(this.lifetime.duration) ||
        this.lifetime.duration <= 0)
    ) {
      throw new RangeError("modifier cycle duration must be positive");
    }
  }

  apply(value: number): number {
    return this.mode === "absolute"
      ? value + this.value
      : value * (1 + this.value);
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

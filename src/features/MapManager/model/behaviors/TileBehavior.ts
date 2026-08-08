import { BehaviorInheritanceScore } from "../../../../core/types/cards";
import type {
  BirthHookContext,
  CycleHookContext,
  DeathHookContext,
  MapEffect,
} from "../lifecycle/types";

export { BehaviorInheritanceScore } from "../../../../core/types/cards";

/** Capacité métier immuable attachée à une tuile vivante. */
export abstract class TileBehavior {
  abstract readonly id: string;
  abstract readonly inheritableScore: number;

  onBirth?(_context: BirthHookContext): ReadonlyArray<MapEffect>;
  onCycle?(_context: CycleHookContext): ReadonlyArray<MapEffect>;
  onDeath?(_context: DeathHookContext): ReadonlyArray<MapEffect>;

  /** Produit la copie transmise à un enfant, ou null si le budget est épuisé. */
  inherit(): TileBehavior | null {
    validateInheritanceScore(this.inheritableScore);
    if (this.inheritableScore === BehaviorInheritanceScore.NONE) {
      return null;
    }
    if (this.inheritableScore === BehaviorInheritanceScore.INFINITE) {
      return this;
    }

    return this.withInheritanceScore(this.inheritableScore - 1);
  }

  protected abstract withInheritanceScore(score: number): TileBehavior;
}

export function validateInheritanceScore(score: number): void {
  if (
    !Number.isSafeInteger(score) ||
    score < BehaviorInheritanceScore.INFINITE
  ) {
    throw new RangeError(
      "behavior inheritance score must be INFINITE (-1), NONE (0), or a positive safe integer",
    );
  }
}

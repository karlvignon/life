import type { TileBehavior } from "../behaviors/TileBehavior";
import type { Essence } from "../essences/Essence";
import type {
  BirthHookContext,
  CycleHookContext,
  DeathHookContext,
  LifecyclePhase,
  SourcedMapEffect,
} from "./types";

type HookContext = BirthHookContext | CycleHookContext | DeathHookContext;

/** Évalue des hooks purs et estampille leurs effets avec leur vraie source. */
export class LifecycleHookRunner {
  run(
    phase: LifecyclePhase,
    essence: Essence,
    behaviors: ReadonlyArray<TileBehavior>,
    context: HookContext,
  ): SourcedMapEffect[] {
    const sourcedEffects: SourcedMapEffect[] = [];

    for (const behavior of behaviors) {
      const effects = evaluateBehavior(behavior, phase, context);
      for (const effect of effects) {
        sourcedEffects.push({
          source: {
            lifeId: context.self.lifeId,
            behaviorId: behavior.id,
            phase,
            x: context.self.x,
            y: context.self.y,
            essence,
            playerId: context.self.provenance.playerId,
          },
          effect,
        });
      }
    }

    return sourcedEffects;
  }
}

function evaluateBehavior(
  behavior: TileBehavior,
  phase: LifecyclePhase,
  context: HookContext,
) {
  switch (phase) {
    case "birth":
      return behavior.onBirth?.(context as BirthHookContext) ?? [];
    case "cycle":
      return behavior.onCycle?.(context as CycleHookContext) ?? [];
    case "death":
      return behavior.onDeath?.(context as DeathHookContext) ?? [];
  }
}

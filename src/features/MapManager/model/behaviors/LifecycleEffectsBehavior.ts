import type {
  CardMapEffectDefinition,
  CardBehaviorDefinition,
} from "../../../../core/types/cards";
import type {
  BirthHookContext,
  CycleHookContext,
  DeathHookContext,
  HookTileSnapshot,
  MapEffect,
} from "../lifecycle/types";
import { TileBehavior, validateInheritanceScore } from "./TileBehavior";

export type LifecycleEffectsBehaviorDefinition = Extract<
  CardBehaviorDefinition,
  { readonly type: "lifecycle-effects" }
>;

/** Behavior déclaratif capable de produire des effets aux trois phases de vie. */
export class LifecycleEffectsBehavior extends TileBehavior {
  readonly id: string;
  readonly inheritableScore: number;
  private readonly definition: LifecycleEffectsBehaviorDefinition;

  constructor(definition: LifecycleEffectsBehaviorDefinition) {
    super();
    if (!definition.id.trim()) {
      throw new RangeError("lifecycle behavior id must not be empty");
    }
    validateInheritanceScore(definition.inheritableScore);
    validateCycleInterval(definition.onCycle?.every);
    validateEffects(definition.onBirth ?? []);
    validateEffects(definition.onCycle?.effects ?? []);
    validateEffects(definition.onDeath ?? []);

    this.id = definition.id;
    this.inheritableScore = definition.inheritableScore;
    this.definition = freezeDefinition(definition);
    Object.freeze(this);
  }

  onBirth(context: BirthHookContext): ReadonlyArray<MapEffect> {
    return resolveEffects(this.definition.onBirth ?? [], context.self);
  }

  onCycle(context: CycleHookContext): ReadonlyArray<MapEffect> {
    const cycleHook = this.definition.onCycle;
    if (!cycleHook || context.cycle % (cycleHook.every ?? 1) !== 0) {
      return [];
    }
    return resolveEffects(cycleHook.effects, context.self);
  }

  onDeath(context: DeathHookContext): ReadonlyArray<MapEffect> {
    return resolveEffects(this.definition.onDeath ?? [], context.self);
  }

  protected withInheritanceScore(score: number): TileBehavior {
    return new LifecycleEffectsBehavior({
      ...this.definition,
      inheritableScore: score,
    });
  }
}

function resolveEffects(
  definitions: ReadonlyArray<CardMapEffectDefinition>,
  source: HookTileSnapshot,
): MapEffect[] {
  return definitions.map((definition) => {
    const target = {
      x: source.x + definition.target.offsetX,
      y: source.y + definition.target.offsetY,
    };

    switch (definition.type) {
      case "spawn-essence":
        return {
          type: definition.type,
          target,
          essenceId: definition.essenceId,
          collision: definition.collision,
        };
      case "damage":
      case "heal":
        return { type: definition.type, target, amount: definition.amount };
      case "tile-data:add":
        return {
          type: definition.type,
          target,
          property: definition.property,
          value: definition.value,
        };
      case "modifier:add":
        return {
          type: definition.type,
          target,
          key: definition.key,
          modifier: {
            property: definition.property,
            mode: definition.mode,
            value: definition.value,
          },
          lifetime: definition.lifetime,
        };
      case "modifier:remove":
        return {
          type: definition.type,
          target,
          key: definition.key,
          source: definition.source,
        };
    }
  });
}

function validateEffects(
  effects: ReadonlyArray<CardMapEffectDefinition>,
): void {
  for (const effect of effects) {
    if (
      !Number.isSafeInteger(effect.target.offsetX) ||
      !Number.isSafeInteger(effect.target.offsetY)
    ) {
      throw new RangeError("lifecycle effect offsets must be safe integers");
    }
    if (
      (effect.type === "damage" || effect.type === "heal") &&
      (!Number.isFinite(effect.amount) || effect.amount < 0)
    ) {
      throw new RangeError("damage and heal amounts must be non-negative");
    }
    if (effect.type === "spawn-essence" && !effect.essenceId.trim()) {
      throw new RangeError("spawned essence id must not be empty");
    }
    if (effect.type === "tile-data:add" && !Number.isFinite(effect.value)) {
      throw new RangeError("tile data effect value must be finite");
    }
    if (effect.type === "modifier:add") {
      if (!effect.key.trim() || !Number.isFinite(effect.value)) {
        throw new RangeError("modifier key and value must be valid");
      }
      if (
        effect.lifetime?.type === "cycles" &&
        (!Number.isSafeInteger(effect.lifetime.duration) ||
          effect.lifetime.duration <= 0)
      ) {
        throw new RangeError("modifier cycle duration must be positive");
      }
    }
    if (effect.type === "modifier:remove" && !effect.key.trim()) {
      throw new RangeError("modifier removal key must not be empty");
    }
  }
}

function validateCycleInterval(interval: number | undefined): void {
  if (
    interval !== undefined &&
    (!Number.isSafeInteger(interval) || interval <= 0)
  ) {
    throw new RangeError("lifecycle cycle interval must be positive");
  }
}

function freezeDefinition(
  definition: LifecycleEffectsBehaviorDefinition,
): LifecycleEffectsBehaviorDefinition {
  return Object.freeze({
    ...definition,
    onBirth: definition.onBirth && freezeEffects(definition.onBirth),
    onCycle:
      definition.onCycle &&
      Object.freeze({
        ...definition.onCycle,
        effects: freezeEffects(definition.onCycle.effects),
      }),
    onDeath: definition.onDeath && freezeEffects(definition.onDeath),
  });
}

function freezeEffects(
  effects: ReadonlyArray<CardMapEffectDefinition>,
): ReadonlyArray<CardMapEffectDefinition> {
  return Object.freeze(
    effects.map((effect) =>
      Object.freeze({
        ...effect,
        target: Object.freeze({ ...effect.target }),
        ...(effect.type === "modifier:add" && effect.lifetime
          ? { lifetime: Object.freeze({ ...effect.lifetime }) }
          : {}),
      }),
    ),
  );
}

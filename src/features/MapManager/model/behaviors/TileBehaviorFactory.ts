import type { CardBehaviorDefinition } from "../../../../core/types/cards";
import { BlindSeeding } from "./BlindSeeding";
import { LifecycleEffectsBehavior } from "./LifecycleEffectsBehavior";
import { SeedRange } from "./SeedRange";
import type { TileBehavior } from "./TileBehavior";

export type TileBehaviorType = CardBehaviorDefinition["type"];
export type TileBehaviorCreator = (
  definition: CardBehaviorDefinition,
) => TileBehavior;

const DEFAULT_CREATORS: ReadonlyArray<
  readonly [TileBehaviorType, TileBehaviorCreator]
> = [
  [
    "seed-range",
    (definition) => {
      if (definition.type !== "seed-range") {
        throw new TypeError("seed-range creator received another behavior");
      }
      return new SeedRange(definition.value);
    },
  ],
  ["blind-seeding", () => new BlindSeeding()],
  [
    "lifecycle-effects",
    (definition) => {
      if (definition.type !== "lifecycle-effects") {
        throw new TypeError("lifecycle creator received another behavior");
      }
      return new LifecycleEffectsBehavior(definition);
    },
  ],
];

/** Résout les définitions déclaratives des cartes en comportements de tile. */
export class TileBehaviorFactory {
  private readonly creators: ReadonlyMap<TileBehaviorType, TileBehaviorCreator>;

  constructor(
    entries: ReadonlyArray<
      readonly [TileBehaviorType, TileBehaviorCreator]
    > = DEFAULT_CREATORS,
  ) {
    const creators = new Map<TileBehaviorType, TileBehaviorCreator>();
    for (const [type, creator] of entries) {
      if (creators.has(type)) {
        throw new RangeError(`Duplicate tile behavior creator: ${type}`);
      }
      creators.set(type, creator);
    }
    this.creators = creators;
  }

  create(definition: CardBehaviorDefinition): TileBehavior {
    const creator = this.creators.get(definition.type);
    if (!creator) {
      throw new Error(`Unknown tile behavior: ${definition.type}`);
    }
    return creator(definition);
  }

  createMany(
    definitions: ReadonlyArray<CardBehaviorDefinition>,
  ): ReadonlyArray<TileBehavior> {
    return definitions.map((definition) => this.create(definition));
  }
}

export const tileBehaviorFactory = new TileBehaviorFactory();

export function createTileBehavior(
  definition: CardBehaviorDefinition,
): TileBehavior {
  return tileBehaviorFactory.create(definition);
}

export function createTileBehaviors(
  definitions: ReadonlyArray<CardBehaviorDefinition>,
): ReadonlyArray<TileBehavior> {
  return tileBehaviorFactory.createMany(definitions);
}

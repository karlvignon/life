import type { EssenceId } from "../../../../core/types/cards";
import type { Essence } from "./Essence";
import { FloraEssence } from "./FloraEssence";
import { GameOfLifeEssence } from "./GameOfLifeEssence";
import { HighLifeEssence } from "./HighLifeEssence";
import { MushroomEssence } from "./MushroomEssence";
import { MushroomSproutEssence } from "./MushroomSproutEssence";
import { StaticEssence } from "./StaticEssence";
import { TreeEssence } from "./TreeEssence";

export type EssenceFactory = () => Essence;

export class EssenceCatalog {
  private readonly factories: ReadonlyMap<EssenceId, EssenceFactory>;
  private readonly instances: ReadonlyMap<EssenceId, Essence>;

  constructor(entries: ReadonlyArray<readonly [EssenceId, EssenceFactory]>) {
    const factories = new Map<EssenceId, EssenceFactory>();
    const instances = new Map<EssenceId, Essence>();
    for (const [id, factory] of entries) {
      if (!id.trim() || factories.has(id)) {
        throw new RangeError(
          "essence catalog ids must be unique and non-empty",
        );
      }
      const essence = factory();
      if (essence.id !== id) {
        throw new RangeError(`essence factory ${id} created ${essence.id}`);
      }
      factories.set(id, factory);
      instances.set(id, essence);
    }
    this.factories = factories;
    this.instances = instances;
  }

  get(id: EssenceId): Essence {
    const essence = this.instances.get(id);
    if (!essence) {
      throw new Error(`Unknown essence: ${id}`);
    }
    return essence;
  }

  create(id: EssenceId): Essence {
    const factory = this.factories.get(id);
    if (!factory) {
      throw new Error(`Unknown essence: ${id}`);
    }
    return factory();
  }

  has(id: EssenceId): boolean {
    return this.factories.has(id);
  }
}

export const essenceCatalog = new EssenceCatalog([
  ["game-of-life", () => new GameOfLifeEssence()],
  ["high-life", () => new HighLifeEssence()],
  ["static", () => new StaticEssence()],
  ["mushroom", () => new MushroomEssence()],
  ["mushroom-sprout", () => new MushroomSproutEssence()],
  ["flora", () => new FloraEssence()],
  ["tree", () => new TreeEssence()],
]);

export function createEssence(essenceId: EssenceId): Essence {
  return essenceCatalog.create(essenceId);
}

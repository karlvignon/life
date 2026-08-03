import type { Essence, EssencePropertiesDelta } from "./essences/Essence";
import type { TileSnapshot } from "../types";

export interface TilePropertiesSnapshot {
  readonly life: number;
  readonly maximumLife: number;
}

export class Tile {
  private alive = false;
  private essence: Essence | null = null;
  private life = 0;
  private maximumLife = 0;

  constructor(
    public readonly x: number,
    public readonly y: number,
    alive = false,
    essence: Essence | null = null,
  ) {
    this.setAlive(alive, essence ?? undefined);
  }

  isAlive(): boolean {
    return this.alive;
  }

  getEssence(): Essence | null {
    return this.essence;
  }

  getLife(): number {
    return this.life;
  }

  getMaximumLife(): number {
    return this.maximumLife;
  }

  hasPositiveLife(): boolean {
    return this.life > 0;
  }

  apply({ life }: EssencePropertiesDelta): void {
    if (!this.alive) {
      return;
    }

    this.life += life;
  }

  setAlive(
    alive: boolean,
    essence?: Essence,
    properties?: TilePropertiesSnapshot,
  ): void {
    if (alive && essence) {
      const shouldInitialize = !this.alive || this.essence !== essence;
      this.alive = true;
      this.essence = essence;

      if (properties) {
        this.life = properties.life;
        this.maximumLife = properties.maximumLife;
      } else if (shouldInitialize) {
        const initialProperties = essence.getInitialProperties();
        this.life = initialProperties.life;
        this.maximumLife = initialProperties.life;
      }
    } else if (!alive) {
      this.alive = false;
      this.essence = null;
      this.life = 0;
      this.maximumLife = 0;
    }
  }

  toSnapshot(): TileSnapshot {
    return {
      x: this.x,
      y: this.y,
      alive: this.alive,
      essence: this.essence,
      life: this.life,
      maximumLife: this.maximumLife,
    };
  }
}

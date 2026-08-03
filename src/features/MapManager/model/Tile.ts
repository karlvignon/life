import type { Essence, EssencePropertiesDelta } from "./essences/Essence";
import { Modifier, type ModifierAuthor } from "./modifiers/Modifier";
import { TileData, type TileDataProperties } from "./TileData";
import type { TileSnapshot } from "../types";

export class Tile {
  private essence: Essence | null = null;
  private data: TileData | null = null;
  private modifiers: Modifier[] = [];

  constructor(
    public readonly x: number,
    public readonly y: number,
    alive = false,
    essence: Essence | null = null,
  ) {
    this.setAlive(alive, essence ?? undefined);
  }

  isAlive(): boolean {
    return this.essence !== null && this.data !== null;
  }

  getEssence(): Essence | null {
    return this.essence;
  }

  getData(): TileData | null {
    return this.data;
  }

  getModifiers(): ReadonlyArray<Modifier> {
    return this.modifiers;
  }

  addModifier(modifier: Modifier): void {
    this.modifiers.push(modifier);
  }

  removeModifiersAuthoredBy(author: ModifierAuthor): void {
    this.modifiers = this.modifiers.filter(
      (modifier) => !modifier.isAuthoredBy(author),
    );
  }

  clearModifiers(): void {
    this.modifiers = [];
  }

  apply(delta: EssencePropertiesDelta): void {
    if (!this.data) {
      return;
    }

    this.data.apply(delta);
  }

  setAlive(
    alive: boolean,
    essence?: Essence,
    properties?: TileDataProperties,
  ): void {
    if (alive && essence) {
      const shouldInitialize = !this.isAlive() || this.essence !== essence;
      this.essence = essence;

      if (properties) {
        this.data = new TileData(properties);
      } else if (shouldInitialize) {
        this.data = essence.createTileData();
      }
    } else if (!alive) {
      this.essence = null;
      this.data = null;
    }
  }

  toSnapshot(): TileSnapshot {
    return {
      x: this.x,
      y: this.y,
      alive: this.isAlive(),
      essence: this.essence,
      data: this.data?.toProperties() ?? null,
    };
  }
}

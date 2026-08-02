import type { Essence } from "./essences/Essence";
import type { TileSnapshot } from "../types";

export class Tile {
  private alive = false;
  private essence: Essence | null = null;

  constructor(
    public readonly x: number,
    public readonly y: number,
    alive = false,
    essence: Essence | null = null,
  ) {
    this.alive = alive;
    this.essence = alive ? essence : null;
  }

  isAlive(): boolean {
    return this.alive;
  }

  getEssence(): Essence | null {
    return this.essence;
  }

  setAlive(alive: boolean, essence?: Essence): void {
    this.alive = alive;
    if (alive && essence) {
      this.essence = essence;
    } else if (!alive) {
      this.essence = null;
    }
  }

  toSnapshot(): TileSnapshot {
    return {
      x: this.x,
      y: this.y,
      alive: this.alive,
      essence: this.essence,
    };
  }
}

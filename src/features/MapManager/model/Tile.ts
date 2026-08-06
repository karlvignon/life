import type { Essence, EssencePropertiesDelta } from "./essences/Essence";
import { Modifier, type ModifierAuthor } from "./modifiers/Modifier";
import { TileData, type TileDataProperties } from "./TileData";
import type { TileProvenance, TileSnapshot } from "../types";

export interface LivingTileState {
  readonly essence: Essence;
  readonly properties?: TileDataProperties;
  readonly provenance: TileProvenance;
}

export class Tile {
  private essence: Essence | null = null;
  private data: TileData | null = null;
  private provenance: TileProvenance | null = null;
  private modifiers: Modifier[] = [];

  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}

  isAlive(): boolean {
    return this.essence !== null && this.data !== null;
  }

  getEssence(): Essence | null {
    return this.essence;
  }

  getData(): TileData | null {
    return this.data;
  }

  getProvenance(): TileProvenance | null {
    return this.provenance;
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

  makeAlive(state: LivingTileState): void {
    if (!state.provenance.playerId.trim()) {
      throw new RangeError("tile owner player id must not be empty");
    }

    const shouldInitialize = !this.isAlive() || this.essence !== state.essence;
    this.essence = state.essence;
    this.provenance = Object.freeze({ ...state.provenance });

    if (state.properties) {
      this.data = new TileData(state.properties);
    } else if (shouldInitialize) {
      this.data = state.essence.createTileData();
    }
  }

  kill(): void {
    this.essence = null;
    this.data = null;
    this.provenance = null;
  }

  toSnapshot(): TileSnapshot {
    return {
      x: this.x,
      y: this.y,
      alive: this.isAlive(),
      essence: this.essence,
      data: this.data?.toProperties() ?? null,
      provenance: this.provenance,
    };
  }
}

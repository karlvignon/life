import type { Essence, EssencePropertiesDelta } from "./essences/Essence";
import { Modifier, type ModifierAuthor } from "./modifiers/Modifier";
import { TileData, type TileDataProperties } from "./TileData";
import type { TileProvenance, TileSnapshot } from "../types";
import type { TileBehavior } from "./behaviors/TileBehavior";

export interface LivingTileState {
  readonly essence: Essence;
  readonly properties?: TileDataProperties;
  readonly provenance: TileProvenance;
  readonly behaviors?: ReadonlyArray<TileBehavior>;
}

export class Tile {
  private essence: Essence | null = null;
  private data: TileData | null = null;
  private provenance: TileProvenance | null = null;
  private modifiers: Modifier[] = [];
  private behaviors: TileBehavior[] = [];

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

  getBehaviors(): ReadonlyArray<TileBehavior> {
    return this.behaviors;
  }

  getBehavior<Behavior extends TileBehavior>(
    behaviorId: string,
  ): Behavior | null {
    return (
      (this.behaviors.find(({ id }) => id === behaviorId) as
        Behavior | undefined) ?? null
    );
  }

  addBehavior(behavior: TileBehavior): void {
    validateBehavior(behavior);
    this.behaviors = [
      ...this.behaviors.filter(({ id }) => id !== behavior.id),
      behavior,
    ];
  }

  removeBehavior(behaviorId: string): boolean {
    const nextBehaviors = this.behaviors.filter(({ id }) => id !== behaviorId);
    if (nextBehaviors.length === this.behaviors.length) {
      return false;
    }

    this.behaviors = nextBehaviors;
    return true;
  }

  setBehaviors(behaviors: ReadonlyArray<TileBehavior>): void {
    const ids = new Set<string>();
    for (const behavior of behaviors) {
      validateBehavior(behavior);
      if (ids.has(behavior.id)) {
        throw new RangeError("tile behavior ids must be unique");
      }
      ids.add(behavior.id);
    }

    this.behaviors = [...behaviors];
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

    if (state.behaviors !== undefined) {
      this.setBehaviors(state.behaviors);
    } else if (shouldInitialize) {
      this.behaviors = [];
    }
  }

  kill(): void {
    this.essence = null;
    this.data = null;
    this.provenance = null;
    this.behaviors = [];
  }

  toSnapshot(): TileSnapshot {
    return {
      x: this.x,
      y: this.y,
      alive: this.isAlive(),
      essence: this.essence,
      data: this.data?.toProperties() ?? null,
      provenance: this.provenance,
      behaviors: [...this.behaviors],
    };
  }
}

function validateBehavior(behavior: TileBehavior): void {
  if (!behavior.id.trim()) {
    throw new RangeError("tile behavior id must not be empty");
  }
}

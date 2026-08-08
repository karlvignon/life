import type { Essence, EssencePropertiesDelta } from "./essences/Essence";
import { TileData, type TileDataProperties } from "./TileData";
import type { TileProvenance, TileSnapshot } from "../types";
import {
  type TileBehavior,
  validateInheritanceScore,
} from "./behaviors/TileBehavior";
import type { PlaceableRotation } from "./Placeable";

export interface LivingTileState {
  readonly essence: Essence;
  readonly properties?: TileDataProperties;
  readonly provenance: TileProvenance;
  readonly behaviors?: ReadonlyArray<TileBehavior>;
  readonly rotation?: PlaceableRotation;
  readonly lifeId?: string;
}

export class Tile {
  private essence: Essence | null = null;
  private data: TileData | null = null;
  private provenance: TileProvenance | null = null;
  private behaviors: TileBehavior[] = [];
  private rotation: PlaceableRotation = 0;
  /** Identifie l'incarnation actuelle, indépendamment de la position de la tuile. */
  private lifeId: string | null = null;
  private lifeSequence = 0;

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

  getRotation(): PlaceableRotation {
    return this.rotation;
  }

  getLifeId(): string | null {
    return this.lifeId;
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
    if (state.lifeId !== undefined && !state.lifeId.trim()) {
      throw new RangeError("tile life id must not be empty");
    }

    const shouldInitialize = !this.isAlive() || this.essence !== state.essence;
    this.essence = state.essence;
    this.provenance = Object.freeze({ ...state.provenance });

    if (shouldInitialize) {
      this.lifeId =
        state.lifeId ?? `${this.x}:${this.y}:${++this.lifeSequence}`;
    } else if (state.lifeId !== undefined && state.lifeId !== this.lifeId) {
      throw new Error(
        "cannot replace a living tile life id without a new life",
      );
    }

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

    if (state.rotation !== undefined) {
      this.rotation = state.rotation;
    } else if (shouldInitialize) {
      this.rotation = 0;
    }
  }

  kill(): void {
    this.essence = null;
    this.data = null;
    this.provenance = null;
    this.behaviors = [];
    this.rotation = 0;
    this.lifeId = null;
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
      rotation: this.rotation,
      lifeId: this.lifeId,
    };
  }
}

function validateBehavior(behavior: TileBehavior): void {
  if (!behavior.id.trim()) {
    throw new RangeError("tile behavior id must not be empty");
  }
  validateInheritanceScore(behavior.inheritableScore);
}

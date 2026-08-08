import type { EssenceId } from "../../../../core/types/cards";
import type { CellIndex, GridBounds } from "../../../../core/types/grid";
import type { WeatherSnapshot } from "../../../../core/types/weather";
import type { Essence } from "../essences/Essence";
import type {
  ModifierDefinition,
  ModifierLifetime,
} from "../modifiers/Modifier";
import type { PlaceableRotation } from "../Placeable";
import type { TileDataProperties } from "../TileData";
import type { TileProvenance } from "../../types";

export type BirthCause = "player-placement" | "simulation" | "hook";
export type DeathCause = "damage" | "evolution" | "weather" | "replacement";
export type LifecyclePhase = "birth" | "cycle" | "death";

export interface HookTileSnapshot {
  readonly index: CellIndex;
  readonly x: number;
  readonly y: number;
  readonly lifeId: string;
  readonly essenceId: EssenceId;
  readonly data: Readonly<TileDataProperties>;
  readonly provenance: TileProvenance;
  readonly rotation: PlaceableRotation;
  readonly behaviorIds: ReadonlyArray<string>;
}

export interface MapQuery {
  readonly bounds: GridBounds;
  getTile(x: number, y: number): HookTileSnapshot | null;
  getLivingTiles(): ReadonlyArray<HookTileSnapshot>;
}

interface BaseHookContext {
  readonly cycle: number;
  readonly self: HookTileSnapshot;
  readonly map: MapQuery;
}

export interface BirthHookContext extends BaseHookContext {
  readonly cause: BirthCause;
}

export interface CycleHookContext extends BaseHookContext {
  readonly weather: Readonly<WeatherSnapshot>;
}

export interface DeathHookContext extends BaseHookContext {
  readonly cause: DeathCause;
}

export interface MapPosition {
  readonly x: number;
  readonly y: number;
}

export type MapEffect =
  | {
      readonly type: "spawn-essence";
      readonly target: MapPosition;
      readonly essenceId: EssenceId;
      readonly collision?: "if-empty" | "replace";
    }
  | {
      readonly type: "damage";
      readonly target: MapPosition;
      readonly amount: number;
    }
  | {
      readonly type: "heal";
      readonly target: MapPosition;
      readonly amount: number;
    }
  | {
      readonly type: "tile-data:add";
      readonly target: MapPosition;
      readonly property: keyof TileDataProperties;
      readonly value: number;
    }
  | {
      readonly type: "modifier:add";
      readonly target: MapPosition;
      readonly key: string;
      readonly modifier: ModifierDefinition;
      readonly lifetime?: ModifierLifetime;
    }
  | {
      readonly type: "modifier:remove";
      readonly target: MapPosition;
      readonly key: string;
      readonly source?: "self" | "any";
    };

export interface EffectSource {
  readonly lifeId: string;
  readonly behaviorId: string;
  readonly phase: LifecyclePhase;
  readonly x: number;
  readonly y: number;
  readonly essence: Essence;
  readonly playerId: string;
}

export interface SourcedMapEffect {
  readonly source: EffectSource;
  readonly effect: MapEffect;
}

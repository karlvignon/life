import type { PlayerId } from "../../core/types/player";
import type { Essence } from "./model/essences/Essence";
import type { Pattern } from "./model/patterns/Pattern";
import { Tile } from "./model/Tile";
import type { TileDataProperties } from "./model/TileData";
import type { TileBehavior } from "./model/behaviors/TileBehavior";
import type { PlaceableRotation } from "./model/Placeable";

export type TileProvenance =
  | {
      readonly kind: "player-placement";
      readonly playerId: PlayerId;
    }
  | {
      readonly kind: "simulation-birth";
      readonly playerId: PlayerId;
    };

export interface TileSnapshot {
  x: number;
  y: number;
  alive: boolean;
  essence: Essence | null;
  data: TileDataProperties | null;
  provenance: TileProvenance | null;
  behaviors: ReadonlyArray<TileBehavior>;
  rotation: PlaceableRotation;
}

export type HorizontalAlign = "start" | "center" | "end";
export type VerticalAlign = "start" | "center" | "end";

export interface TileInfoUiLayoutConfig {
  /** Point d'ancrage normalisé dans le parent (0–1). */
  anchor: { x: number; y: number };
  horizontalAlign: HorizontalAlign;
  verticalAlign: VerticalAlign;
  margin?: { x: number; y: number };
  maxWidth?: number;
  maxHeight?: number;
}

export interface ParentLayoutBounds {
  width: number;
  height: number;
}

export const DEFAULT_TILE_INFO_UI_LAYOUT: TileInfoUiLayoutConfig = {
  anchor: { x: 1, y: 0 },
  horizontalAlign: "end",
  verticalAlign: "start",
  margin: { x: 12, y: 12 },
  maxWidth: 248,
  maxHeight: 320,
};

export interface MapConfig {
  cellSize?: number;
  /** Essence appliquée au motif initial. */
  defaultEssence?: Essence;
  /** Motif initial placé au centre de la grille au premier layout. */
  initialPattern?: Pattern;
  tileInfoLayout?: TileInfoUiLayoutConfig;
}

export type MapEventMap = {
  "tile:hover": Tile;
  "tile:leave": void;
};

export const DEFAULT_CELL_SIZE = 16;

export function computeGridSize(
  viewWidth: number,
  viewHeight: number,
  cellSize: number,
): { gridWidth: number; gridHeight: number } {
  return {
    gridWidth: Math.max(0, Math.floor(viewWidth / cellSize)),
    gridHeight: Math.max(0, Math.floor(viewHeight / cellSize)),
  };
}

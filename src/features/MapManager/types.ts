import type { Essence } from "./model/essences/Essence";
import type { Spaceship } from "./model/spaceships/Spaceship";
import { Tile } from "./model/Tile";

export interface TileSnapshot {
  x: number;
  y: number;
  alive: boolean;
  essence: Essence | null;
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
  maxWidth: 280,
  maxHeight: 120,
};

export interface MapConfig {
  cellSize?: number;
  /** Essence par défaut pour le vaisseau initial si non fourni explicitement. */
  defaultEssence?: Essence;
  /** Vaisseau initial placé au centre de la grille au premier layout. */
  initialSpaceship?: Spaceship;
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

import type { Essence } from "../model/essences/Essence";
import type { TileSnapshot } from "../types";
import { DEFAULT_GAME_OF_LIFE_COLOR } from "../model/essences/GameOfLifeEssence";

export const DEAD_CELL_COLOR = 0x1a1a2e;
export const DEAD_CELL_BORDER_COLOR = 0x2a2a3e;

/** État visuel d'une cellule — aucune référence Tile/Essence côté View. */
export interface CellVisualState {
  readonly x: number;
  readonly y: number;
  readonly alive: boolean;
  readonly fillColor: number;
}

export interface MapRenderSnapshot {
  readonly revision: number;
  readonly gridWidth: number;
  readonly gridHeight: number;
  readonly cellSize: number;
  readonly livingCells: ReadonlyArray<CellVisualState>;
}

export interface ReproductibilityCellVisualState {
  readonly x: number;
  readonly y: number;
  readonly score: number;
}

export interface ReproductibilityMapSnapshot {
  readonly livingCells: ReadonlyArray<ReproductibilityCellVisualState>;
}

export interface MapRenderDelta {
  readonly revision: number;
  readonly changedCells: ReadonlyArray<CellVisualState>;
}

export type MapRenderUpdate =
  | { kind: "full"; snapshot: MapRenderSnapshot }
  | { kind: "delta"; delta: MapRenderDelta };

export function tileSnapshotToCellVisualState(
  snapshot: TileSnapshot,
): CellVisualState {
  return {
    x: snapshot.x,
    y: snapshot.y,
    alive: snapshot.alive,
    fillColor: snapshot.alive
      ? (snapshot.essence?.color ?? DEFAULT_GAME_OF_LIFE_COLOR)
      : DEAD_CELL_COLOR,
  };
}

export function livingCellVisualState(
  x: number,
  y: number,
  essence: Essence,
  fillColor = essence.color,
): CellVisualState {
  return {
    x,
    y,
    alive: true,
    fillColor,
  };
}

export function deadCellVisualState(x: number, y: number): CellVisualState {
  return {
    x,
    y,
    alive: false,
    fillColor: DEAD_CELL_COLOR,
  };
}

export function mergeRenderDeltas(
  previous: MapRenderDelta | null,
  next: MapRenderDelta,
): MapRenderDelta {
  if (!previous || previous.changedCells.length === 0) {
    return next;
  }

  const merged = new Map<string, CellVisualState>();

  for (const cell of previous.changedCells) {
    merged.set(`${cell.x},${cell.y}`, cell);
  }

  for (const cell of next.changedCells) {
    merged.set(`${cell.x},${cell.y}`, cell);
  }

  return {
    revision: next.revision,
    changedCells: [...merged.values()],
  };
}

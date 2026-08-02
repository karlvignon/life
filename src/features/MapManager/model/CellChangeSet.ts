import type { Essence } from "./essences/Essence";

export interface CellChange {
  readonly x: number;
  readonly y: number;
  readonly alive: boolean;
  readonly essence: Essence | null;
}

export interface CellChangeSet {
  readonly changes: ReadonlyArray<CellChange>;
}

export function emptyChangeSet(): CellChangeSet {
  return { changes: [] };
}

export function mergeChangeSets(
  previous: CellChangeSet | null,
  next: CellChangeSet,
): CellChangeSet {
  if (!previous || previous.changes.length === 0) {
    return next;
  }

  if (next.changes.length === 0) {
    return previous;
  }

  const merged = new Map<string, CellChange>();

  for (const change of previous.changes) {
    merged.set(`${change.x},${change.y}`, change);
  }

  for (const change of next.changes) {
    merged.set(`${change.x},${change.y}`, change);
  }

  return { changes: [...merged.values()] };
}

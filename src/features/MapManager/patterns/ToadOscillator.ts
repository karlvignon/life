import type { Essence } from "../Essence";
import { Pattern } from "../Pattern";
import type { CellOffset } from "../types";

/** Oscillateur période 2 — 6 cellules. */
export class ToadOscillator extends Pattern {
  constructor(essence: Essence) {
    super(essence);
  }

  getCells(): ReadonlyArray<CellOffset> {
    return [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ];
  }
}

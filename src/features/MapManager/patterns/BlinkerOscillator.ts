import type { Essence } from "../Essence";
import { Pattern } from "../Pattern";
import type { CellOffset } from "../types";

/** Oscillateur période 2 — 3 cellules en ligne. */
export class BlinkerOscillator extends Pattern {
  constructor(essence: Essence) {
    super(essence);
  }

  getCells(): ReadonlyArray<CellOffset> {
    return [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ];
  }
}

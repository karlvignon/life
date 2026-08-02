import type { Essence } from "../Essence";
import { Pattern } from "../Pattern";
import type { CellOffset } from "../types";

/** Motif statique — une seule cellule. */
export class Tree extends Pattern {
  constructor(essence: Essence) {
    super(essence);
  }

  getCells(): ReadonlyArray<CellOffset> {
    return [{ x: 0, y: 0 }];
  }
}

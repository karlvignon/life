import type { Essence } from "../essences/Essence";
import { Pattern } from "./Pattern";
import type { CellOffset } from "../../../../core/types/grid";

/** Motif statique — une seule cellule. */
export class Tree extends Pattern {
  constructor(essence: Essence) {
    super(essence);
  }

  getCells(): ReadonlyArray<CellOffset> {
    return [{ x: 0, y: 0 }];
  }
}

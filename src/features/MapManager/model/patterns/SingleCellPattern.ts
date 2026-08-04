import { Pattern } from "./Pattern";
import type { CellOffset } from "../../../../core/types/grid";

/** Motif minimal — une seule cellule vivante. */
export class SingleCellPattern extends Pattern {
  readonly id = "cell";

  getCells(): ReadonlyArray<CellOffset> {
    return [{ x: 0, y: 0 }];
  }
}

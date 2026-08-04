import type { CellOffset } from "../../../../core/types/grid";
import { Pattern } from "./Pattern";

/** Croix de cinq cellules centrée sur (1, 1). */
export class FiveCellCrossPattern extends Pattern {
  readonly id = "five-cell-cross";

  getCells(): ReadonlyArray<CellOffset> {
    return [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ];
  }
}

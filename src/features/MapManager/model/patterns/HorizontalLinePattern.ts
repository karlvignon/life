import type { CellOffset } from "../../../../core/types/grid";
import { Pattern } from "./Pattern";

/** Motif générique de trois cellules alignées horizontalement. */
export class HorizontalLinePattern extends Pattern {
  readonly id = "horizontal-line";

  getCells(): ReadonlyArray<CellOffset> {
    return [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ];
  }
}

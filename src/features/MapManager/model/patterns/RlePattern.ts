import { parseRle } from "../../../../shared/parseRle";
import { Pattern } from "./Pattern";
import type { CellOffset } from "../../../../core/types/grid";

export class RlePattern extends Pattern {
  readonly id: Pattern["id"] = "rle";
  private readonly cells: CellOffset[];

  constructor(rle: string) {
    super();
    this.cells = parseRle(rle);
  }

  getCells(): ReadonlyArray<CellOffset> {
    return this.cells;
  }
}

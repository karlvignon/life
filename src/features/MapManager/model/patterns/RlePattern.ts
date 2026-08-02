import { parseRle } from "../../../../shared/parseRle";
import type { Essence } from "../essences/Essence";
import { Pattern } from "./Pattern";
import type { CellOffset } from "../../../../core/types/grid";

export class RlePattern extends Pattern {
  private readonly cells: CellOffset[];

  constructor(rle: string, essence: Essence) {
    super(essence);
    this.cells = parseRle(rle);
  }

  getCells(): ReadonlyArray<CellOffset> {
    return this.cells;
  }
}

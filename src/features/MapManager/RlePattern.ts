import { parseRle } from "../../shared/parseRle";
import type { Essence } from "./Essence";
import { Pattern } from "./Pattern";
import type { CellOffset } from "./types";

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

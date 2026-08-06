import type { PatternId } from "../../../../core/types/cards";
import type { CellOffset } from "../../../../core/types/grid";
import { Pattern } from "./Pattern";
import type { ParsedPatternEncoding } from "./PatternEncoding";

/** Pattern générique construit depuis une définition encodée et validée. */
export class EncodedPattern extends Pattern {
  constructor(
    readonly id: PatternId,
    private readonly definition: ParsedPatternEncoding,
  ) {
    super();
  }

  getCells(): ReadonlyArray<CellOffset> {
    return this.definition.cells;
  }

  override getBounds(): { width: number; height: number } {
    return {
      width: this.definition.width,
      height: this.definition.height,
    };
  }
}

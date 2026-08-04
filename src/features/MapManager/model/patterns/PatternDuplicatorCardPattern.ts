import type { CardPatternId } from "../../../../core/types/cards";
import type { CellOffset } from "../../../../core/types/grid";
import type { BirthPattern } from "../essences/PatternDuplicatorEssence";
import { Pattern } from "./Pattern";

/** Motif plaçable qui reproduit les cellules requises autour du centre vide. */
export class PatternDuplicatorCardPattern extends Pattern {
  private readonly cells: ReadonlyArray<Readonly<CellOffset>>;

  constructor(
    readonly id: CardPatternId,
    birthPattern: BirthPattern,
  ) {
    super();

    if (birthPattern.length === 0) {
      throw new RangeError("birth pattern card must contain at least one cell");
    }

    const minX = Math.min(...birthPattern.map(({ x }) => x));
    const minY = Math.min(...birthPattern.map(({ y }) => y));
    this.cells = Object.freeze(
      birthPattern.map(({ x, y }) =>
        Object.freeze({ x: x - minX, y: y - minY }),
      ),
    );
  }

  getCells(): ReadonlyArray<CellOffset> {
    return this.cells;
  }
}

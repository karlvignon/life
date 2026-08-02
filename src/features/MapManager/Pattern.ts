import type { Essence } from "./Essence";
import type { CellOffset } from "./types";

export abstract class Pattern {
  constructor(protected readonly essence: Essence) {}

  getEssence(): Essence {
    return this.essence;
  }

  /** Positions des cellules vivantes relatives à (0, 0) — coin haut-gauche. */
  abstract getCells(): ReadonlyArray<CellOffset>;

  getBounds(): { width: number; height: number } {
    const cells = this.getCells();
    let maxX = 0;
    let maxY = 0;

    for (const cell of cells) {
      maxX = Math.max(maxX, cell.x);
      maxY = Math.max(maxY, cell.y);
    }

    return { width: maxX + 1, height: maxY + 1 };
  }
}

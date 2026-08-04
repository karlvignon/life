import { Pattern } from "./patterns/Pattern";
import type { Essence } from "./essences/Essence";
import type { CellOffset } from "../../../core/types/grid";

export class Placeable {
  constructor(
    private readonly pattern: Pattern,
    private readonly essence: Essence,
    private readonly x: number,
    private readonly y: number,
  ) {}

  getPattern(): Pattern {
    return this.pattern;
  }

  getEssence(): Essence {
    return this.essence;
  }

  getOrigin(): CellOffset {
    return { x: this.x, y: this.y };
  }

  getWorldCells(): CellOffset[] {
    return this.pattern.getCells().map((cell) => ({
      x: this.x + cell.x,
      y: this.y + cell.y,
    }));
  }

  withOrigin(x: number, y: number): Placeable {
    return new Placeable(this.pattern, this.essence, x, y);
  }

  static centerOnGrid(
    pattern: Pattern,
    essence: Essence,
    gridWidth: number,
    gridHeight: number,
  ): Placeable {
    const { width, height } = pattern.getBounds();
    const x = Math.floor(gridWidth / 2) - Math.floor(width / 2);
    const y = Math.floor(gridHeight / 2) - Math.floor(height / 2);

    return new Placeable(pattern, essence, x, y);
  }
}

import { Pattern } from "./patterns/Pattern";
import type { Essence } from "./essences/Essence";
import type { CellOffset } from "../../../core/types/grid";
import type { TileBehavior } from "./behaviors/TileBehavior";

export class Placeable {
  constructor(
    private readonly pattern: Pattern,
    private readonly essence: Essence,
    private readonly x: number,
    private readonly y: number,
    private readonly behaviors: ReadonlyArray<TileBehavior> = [],
  ) {}

  getPattern(): Pattern {
    return this.pattern;
  }

  getEssence(): Essence {
    return this.essence;
  }

  getBehaviors(): ReadonlyArray<TileBehavior> {
    return this.behaviors;
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
    return new Placeable(this.pattern, this.essence, x, y, this.behaviors);
  }

  static centerOnGrid(
    pattern: Pattern,
    essence: Essence,
    gridWidth: number,
    gridHeight: number,
    behaviors: ReadonlyArray<TileBehavior> = [],
  ): Placeable {
    const { width, height } = pattern.getBounds();
    const x = Math.floor(gridWidth / 2) - Math.floor(width / 2);
    const y = Math.floor(gridHeight / 2) - Math.floor(height / 2);

    return new Placeable(pattern, essence, x, y, behaviors);
  }
}

import { Pattern } from "./patterns/Pattern";
import type { Essence } from "./essences/Essence";
import type { CellOffset } from "../../../core/types/grid";
import type { TileBehavior } from "./behaviors/TileBehavior";

export type PlaceableRotation = 0 | 90 | 180 | 270;

export class Placeable {
  constructor(
    private readonly pattern: Pattern,
    private readonly essence: Essence,
    private readonly x: number,
    private readonly y: number,
    private readonly behaviors: ReadonlyArray<TileBehavior> = [],
    private readonly rotation: PlaceableRotation = 0,
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

  getRotation(): PlaceableRotation {
    return this.rotation;
  }

  getBounds(): { width: number; height: number } {
    const bounds = this.pattern.getBounds();

    return this.rotation === 90 || this.rotation === 270
      ? { width: bounds.height, height: bounds.width }
      : bounds;
  }

  getWorldCells(): CellOffset[] {
    const { width, height } = this.pattern.getBounds();

    return this.pattern.getCells().map((cell) => {
      const rotatedCell = rotateCell(cell, width, height, this.rotation);

      return {
        x: this.x + rotatedCell.x,
        y: this.y + rotatedCell.y,
      };
    });
  }

  withOrigin(x: number, y: number): Placeable {
    return new Placeable(
      this.pattern,
      this.essence,
      x,
      y,
      this.behaviors,
      this.rotation,
    );
  }

  withRotation(rotation: PlaceableRotation): Placeable {
    return new Placeable(
      this.pattern,
      this.essence,
      this.x,
      this.y,
      this.behaviors,
      rotation,
    );
  }

  static centerOnGrid(
    pattern: Pattern,
    essence: Essence,
    gridWidth: number,
    gridHeight: number,
    behaviors: ReadonlyArray<TileBehavior> = [],
    rotation: PlaceableRotation = 0,
  ): Placeable {
    const { width, height } = pattern.getBounds();
    const rotatedWidth = rotation === 90 || rotation === 270 ? height : width;
    const rotatedHeight = rotation === 90 || rotation === 270 ? width : height;
    const x = Math.floor(gridWidth / 2) - Math.floor(rotatedWidth / 2);
    const y = Math.floor(gridHeight / 2) - Math.floor(rotatedHeight / 2);

    return new Placeable(pattern, essence, x, y, behaviors, rotation);
  }
}

function rotateCell(
  cell: CellOffset,
  width: number,
  height: number,
  rotation: PlaceableRotation,
): CellOffset {
  switch (rotation) {
    case 90:
      return { x: height - 1 - cell.y, y: cell.x };
    case 180:
      return { x: width - 1 - cell.x, y: height - 1 - cell.y };
    case 270:
      return { x: cell.y, y: width - 1 - cell.x };
    default:
      return cell;
  }
}

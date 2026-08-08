import { Container, Graphics } from "pixi.js";
import type { SeedRangeMapSnapshot } from "./render/types";

export const EMPTY_SEED_RANGE_COLOR = 0xfff3a3;
const RANGE_ALPHA = 0.28;
const RANGE_BORDER_ALPHA = 0.5;

/** Overlay de debug affichant l'union des SeedRange d'une équipe. */
export class SeedRangeMapView extends Container {
  private readonly range = new Graphics();

  constructor(private readonly cellSize: number) {
    super();
    this.eventMode = "none";
    this.visible = false;
    this.addChild(this.range);
  }

  sync(snapshot: SeedRangeMapSnapshot): void {
    this.range.clear();

    for (const cell of snapshot.coveredCells) {
      this.range
        .rect(
          cell.x * this.cellSize,
          cell.y * this.cellSize,
          this.cellSize,
          this.cellSize,
        )
        .fill({ color: EMPTY_SEED_RANGE_COLOR, alpha: RANGE_ALPHA })
        .stroke({
          width: 1,
          color: EMPTY_SEED_RANGE_COLOR,
          alpha: RANGE_BORDER_ALPHA,
        });
    }
  }

  clear(): void {
    this.range.clear();
  }

  override destroy(): void {
    this.clear();
    super.destroy({ children: true });
  }
}

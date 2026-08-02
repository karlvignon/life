import { GameOfLifeEssence } from "./GameOfLifeEssence";

export const DEFAULT_HIGHLIFE_COLOR = 0x3b82f6;

/** Règles HighLife B36/S23 — chaque groupe évolue indépendamment. */
export class HighLifeEssence extends GameOfLifeEssence {
  constructor(color: number = DEFAULT_HIGHLIFE_COLOR) {
    super(color);
  }

  protected shouldBirth(neighbors: number): boolean {
    return neighbors === 3 || neighbors === 6;
  }
}

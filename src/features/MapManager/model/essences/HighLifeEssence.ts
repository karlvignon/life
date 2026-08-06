import { createLifeLikeBehavior } from "../evolution/behaviors/LifeLikeBehavior";
import { Essence } from "./Essence";

export const DEFAULT_HIGHLIFE_COLOR = 0x3b82f6;

const HIGHLIFE_EVOLUTION = createLifeLikeBehavior("highlife-b36-s23", {
  birthNeighborCounts: new Set([3, 6]),
  survivalNeighborCounts: new Set([2, 3]),
});

export class HighLifeEssence extends Essence {
  constructor(color: number = DEFAULT_HIGHLIFE_COLOR) {
    super({
      id: "high-life",
      name: "HighLife",
      color,
      evolutionBehaviors: [HIGHLIFE_EVOLUTION],
    });
  }
}

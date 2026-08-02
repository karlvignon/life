import type { Essence } from "../essences/Essence";
import { Spaceship } from "./Spaceship";
import type { CellOffset } from "../../../../core/types/grid";

/** Middleweight spaceship (MWSS) — vaisseau orthogonal classique (c/2, période 4). */
export class MiddleweightSpaceship extends Spaceship {
  constructor(essence: Essence) {
    super(essence);
  }

  getCells(): ReadonlyArray<CellOffset> {
    return [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
      { x: 0, y: 4 },
    ];
  }
}

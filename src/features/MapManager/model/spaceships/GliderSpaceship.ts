import { Spaceship } from "./Spaceship";
import type { CellOffset } from "../../../../core/types/grid";

/** Plus petit vaisseau diagonal (c/4), découvert en 1970. */
export class GliderSpaceship extends Spaceship {
  readonly id = "glider";

  getCells(): ReadonlyArray<CellOffset> {
    return [
      { x: 1, y: 0 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ];
  }
}

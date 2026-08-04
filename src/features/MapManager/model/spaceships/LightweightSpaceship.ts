import { Spaceship } from "./Spaceship";
import type { CellOffset } from "../../../../core/types/grid";

/** Lightweight spaceship (LWSS) — plus petit vaisseau orthogonal (c/2, période 4). */
export class LightweightSpaceship extends Spaceship {
  readonly id = "lwss";

  getCells(): ReadonlyArray<CellOffset> {
    return [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
    ];
  }
}

import { Spaceship } from "./Spaceship";
import type { CellOffset } from "../../../../core/types/grid";

export class GenesisSpaceship extends Spaceship {
  readonly id = "genesis";

  getCells(): ReadonlyArray<CellOffset> {
    return [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
      { x: 5, y: 0 },
      { x: 0, y: 1 },
      { x: 5, y: 1 },
      { x: 5, y: 2 },
      { x: 0, y: 3 },
      { x: 4, y: 3 },
      { x: 2, y: 4 },
    ];
  }
}

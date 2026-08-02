import type { Essence } from "../Essence";
import { RlePattern } from "../RlePattern";

/** Puffer 1 — premier puffeur découvert (c/2, laisse des blinkers). */
export class Puffer1 extends RlePattern {
  constructor(essence: Essence) {
    super(
      "22b2o$22bo$22bo$21b3o$12b2o8b2o$11b2o10b2o$10b2o12b2o$10b3o11bo$9b2o14bo$9bo16b2o$8bo18bo$8b2o17bo$9bo17bo$9b2o15b2o$10bo14bo$10b2o12b2o$11b3o9b3o$12b2o8b2o!",
      essence,
    );
  }
}

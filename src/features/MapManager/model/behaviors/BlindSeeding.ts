import type { TileBehavior } from "./TileBehavior";

export const BLIND_SEEDING_BEHAVIOR_ID = "blind-seeding";

/** Autorise la carte qui le porte à être posée sans vision alliée préalable. */
export class BlindSeeding implements TileBehavior {
  readonly id = BLIND_SEEDING_BEHAVIOR_ID;

  constructor() {
    Object.freeze(this);
  }
}

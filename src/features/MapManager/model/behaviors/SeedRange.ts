import { TileBehavior } from "./TileBehavior";

export const SEED_RANGE_BEHAVIOR_ID = "seed-range";
export const DEFAULT_SEED_RANGE_VALUE = 3;

/** Portée carrée de vision attachée à une tuile vivante. */
export class SeedRange extends TileBehavior {
  readonly id = SEED_RANGE_BEHAVIOR_ID;
  readonly inheritable = true;
  readonly value: number;

  constructor(value: number = DEFAULT_SEED_RANGE_VALUE) {
    super();
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError("seed range must be a non-negative safe integer");
    }

    this.value = value;
    Object.freeze(this);
  }

  containsOffset(offsetX: number, offsetY: number): boolean {
    return Math.max(Math.abs(offsetX), Math.abs(offsetY)) <= this.value;
  }
}

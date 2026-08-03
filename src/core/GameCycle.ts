const MAX_SAFE_CYCLE = Number.MAX_SAFE_INTEGER;
export const DEFAULT_MAX_STEPS_PER_FRAME = 10;

class GameCycleClock {
  private currentCycle = 0;
  private accumulatorMs = 0;

  getCurrentCycle(): number {
    return this.currentCycle;
  }

  advance(): number {
    if (this.currentCycle >= MAX_SAFE_CYCLE) {
      throw new RangeError("Game cycle exceeded Number.MAX_SAFE_INTEGER");
    }

    this.currentCycle++;
    return this.currentCycle;
  }

  consumeDueCycles(
    dtMs: number,
    stepsPerSecond: number,
    maxStepsPerFrame = DEFAULT_MAX_STEPS_PER_FRAME,
  ): readonly number[] {
    if (!Number.isFinite(dtMs) || dtMs < 0) {
      throw new RangeError("dtMs must be a non-negative finite number");
    }
    if (!Number.isFinite(stepsPerSecond) || stepsPerSecond < 0) {
      throw new RangeError(
        "stepsPerSecond must be a non-negative finite number",
      );
    }
    if (!Number.isSafeInteger(maxStepsPerFrame) || maxStepsPerFrame <= 0) {
      throw new RangeError("maxStepsPerFrame must be a positive safe integer");
    }
    if (stepsPerSecond === 0) {
      return [];
    }

    const stepIntervalMs = 1000 / stepsPerSecond;
    this.accumulatorMs += dtMs;
    const cycles: number[] = [];

    while (
      this.accumulatorMs >= stepIntervalMs &&
      cycles.length < maxStepsPerFrame
    ) {
      cycles.push(this.advance());
      this.accumulatorMs -= stepIntervalMs;
    }

    if (this.accumulatorMs >= stepIntervalMs) {
      this.accumulatorMs = stepIntervalMs;
    }

    return cycles;
  }

  reset(): void {
    this.currentCycle = 0;
    this.accumulatorMs = 0;
  }
}

/** Horloge globale de cycles — une seule source de vérité pour toute la session. */
export const gameCycle = new GameCycleClock();

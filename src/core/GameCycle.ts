const MAX_SAFE_CYCLE = Number.MAX_SAFE_INTEGER;

class GameCycleClock {
  private currentCycle = 0;

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

  reset(): void {
    this.currentCycle = 0;
  }
}

/** Horloge globale de cycles — une seule source de vérité pour toute la session. */
export const gameCycle = new GameCycleClock();

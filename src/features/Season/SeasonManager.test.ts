import { afterEach, describe, expect, it, vi } from "vitest";
import { EventBus } from "../../core/EventBus";
import { gameCycle } from "../../core/GameCycle";
import { SeasonManager } from "./main";

describe("SeasonManager", () => {
  afterEach(() => {
    gameCycle.reset();
  });

  it("emits season progress once per cycle change", () => {
    const eventBus = new EventBus();
    const emitSpy = vi.spyOn(eventBus, "emit");
    const manager = new SeasonManager(eventBus);

    emitSpy.mockClear();
    manager.update();
    expect(emitSpy).not.toHaveBeenCalled();

    gameCycle.advance();
    manager.update();
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith(
      "game:season-progressed",
      expect.objectContaining({
        currentCycle: 1,
        progress: expect.any(Number),
      }),
    );

    manager.update();
    expect(emitSpy).toHaveBeenCalledTimes(1);

    gameCycle.advance();
    manager.update();
    expect(emitSpy).toHaveBeenCalledTimes(2);

    manager.destroy();
    eventBus.clear();
  });
});

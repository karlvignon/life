import { describe, expect, it, vi } from "vitest";
import { EventBus } from "../../core/EventBus";
import type { GameEventMap } from "../../core/types/gameEvents";
import { WeatherModel } from "../Weather/WeatherModel";
import { SeasonManager } from "./main";

describe("SeasonManager", () => {
  it("emits season progress once per cycle change", () => {
    const eventBus = new EventBus();
    const emitSpy = vi.spyOn(eventBus, "emit");
    const manager = new SeasonManager(eventBus);

    emitSpy.mockClear();
    manager.syncToCycle(0);
    expect(emitSpy).not.toHaveBeenCalled();

    manager.syncToCycle(1);
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith(
      "game:season-progressed",
      expect.objectContaining({
        currentCycle: 1,
        progress: expect.any(Number),
      }),
    );

    manager.syncToCycle(1);
    expect(emitSpy).toHaveBeenCalledTimes(1);

    manager.syncToCycle(2);
    expect(emitSpy).toHaveBeenCalledTimes(2);

    manager.destroy();
    eventBus.clear();
  });

  it("synchronously provides weather for the exact requested cycle", () => {
    const eventBus = new EventBus();
    const weather = new WeatherModel();
    eventBus.on<GameEventMap["game:season-progressed"]>(
      "game:season-progressed",
      (transition) => {
        weather.updateFromSeason(transition);
      },
    );
    const manager = new SeasonManager(eventBus);

    manager.syncToCycle(17);

    expect(weather.getSnapshot().cycle).toBe(17);

    manager.destroy();
    eventBus.clear();
  });
});

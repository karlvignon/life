import { afterEach, describe, expect, it } from "vitest";
import { gameCycle } from "./GameCycle";

describe("GameCycle", () => {
  afterEach(() => {
    gameCycle.reset();
  });

  it("starts at cycle 0", () => {
    expect(gameCycle.getCurrentCycle()).toBe(0);
  });

  it("advances and returns the new cycle", () => {
    expect(gameCycle.advance()).toBe(1);
    expect(gameCycle.advance()).toBe(2);
    expect(gameCycle.getCurrentCycle()).toBe(2);
  });

  it("resets to 0", () => {
    gameCycle.advance();
    gameCycle.advance();
    gameCycle.reset();

    expect(gameCycle.getCurrentCycle()).toBe(0);
  });

  it("throws when exceeding Number.MAX_SAFE_INTEGER", () => {
    (gameCycle as unknown as { currentCycle: number }).currentCycle =
      Number.MAX_SAFE_INTEGER;

    expect(() => gameCycle.advance()).toThrow(RangeError);
  });
});

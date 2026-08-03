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

  it("produces due cycles from elapsed simulation time", () => {
    expect(gameCycle.consumeDueCycles(249, 4)).toEqual([]);
    expect(gameCycle.consumeDueCycles(1, 4)).toEqual([1]);
    expect(gameCycle.consumeDueCycles(500, 4)).toEqual([2, 3]);
  });

  it("caps catch-up work per frame", () => {
    expect(gameCycle.consumeDueCycles(10_000, 10, 3)).toEqual([1, 2, 3]);
    expect(gameCycle.getCurrentCycle()).toBe(3);
    expect(gameCycle.consumeDueCycles(0, 10, 3)).toEqual([4]);
  });

  it("does not accumulate cycles while paused", () => {
    expect(gameCycle.consumeDueCycles(10_000, 0)).toEqual([]);
    expect(gameCycle.consumeDueCycles(99, 10)).toEqual([]);
    expect(gameCycle.consumeDueCycles(1, 10)).toEqual([1]);
  });

  it("validates simulation timing inputs", () => {
    expect(() => gameCycle.consumeDueCycles(-1, 1)).toThrow(RangeError);
    expect(() => gameCycle.consumeDueCycles(1, -1)).toThrow(RangeError);
    expect(() => gameCycle.consumeDueCycles(1, 1, 0)).toThrow(RangeError);
  });

  it("throws when exceeding Number.MAX_SAFE_INTEGER", () => {
    (gameCycle as unknown as { currentCycle: number }).currentCycle =
      Number.MAX_SAFE_INTEGER;

    expect(() => gameCycle.advance()).toThrow(RangeError);
  });
});

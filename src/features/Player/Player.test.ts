import { describe, expect, it } from "vitest";
import { Player } from "./Player";

describe("Player", () => {
  it("starts with full stamina by default", () => {
    const player = new Player();

    expect(player.getStaminaSnapshot()).toEqual({
      current: 100,
      maximum: 100,
    });
  });

  it("spends stamina only when enough is available", () => {
    const player = new Player({ maximumStamina: 20 });

    expect(player.trySpendStamina(12)).toBe(true);
    expect(player.getStamina()).toBe(8);
    expect(player.trySpendStamina(9)).toBe(false);
    expect(player.getStamina()).toBe(8);
  });

  it("recovers stamina without exceeding the maximum", () => {
    const player = new Player({ maximumStamina: 20, initialStamina: 4 });

    player.recoverStamina(10.5);
    expect(player.getStamina()).toBe(14.5);

    player.recoverStamina(100);
    expect(player.getStamina()).toBe(20);
  });

  it("validates stamina configuration and mutations", () => {
    expect(() => new Player({ maximumStamina: 0 })).toThrow(RangeError);
    expect(() => new Player({ initialStamina: -1 })).toThrow(RangeError);
    expect(() => new Player().trySpendStamina(-1)).toThrow(RangeError);
    expect(() => new Player().recoverStamina(Number.NaN)).toThrow(RangeError);
  });
});

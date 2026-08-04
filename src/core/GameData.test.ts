import { describe, expect, it } from "vitest";
import { DEFAULT_STAMINA_RECOVERY_PER_SECOND, GameData } from "./GameData";

describe("GameData", () => {
  it("provides the default stamina recovery rate", () => {
    expect(new GameData().staminaRecoveryPerSecond).toBe(
      DEFAULT_STAMINA_RECOVERY_PER_SECOND,
    );
  });

  it("accepts a custom stamina recovery rate", () => {
    expect(
      new GameData({ staminaRecoveryPerSecond: 2.5 }).staminaRecoveryPerSecond,
    ).toBe(2.5);
  });

  it("rejects invalid stamina recovery rates", () => {
    expect(() => new GameData({ staminaRecoveryPerSecond: -1 })).toThrow(
      RangeError,
    );
    expect(
      () => new GameData({ staminaRecoveryPerSecond: Number.NaN }),
    ).toThrow(RangeError);
  });
});

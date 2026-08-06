import { describe, expect, it } from "vitest";
import { PlayerRosterModel } from "./PlayerRosterModel";

describe("PlayerRosterModel", () => {
  it("selects the player authoring placements", () => {
    const model = new PlayerRosterModel([
      { id: "player-1" },
      { id: "player-2" },
    ]);

    expect(model.getSelectedPlayer().getId()).toBe("player-1");
    expect(model.selectPlayer("player-2")).toBe(true);
    expect(model.getSelectedPlayer().getId()).toBe("player-2");
    expect(model.selectPlayer("unknown")).toBe(false);
  });

  it("rejects empty rosters and duplicate player ids", () => {
    expect(() => new PlayerRosterModel([])).toThrow(RangeError);
    expect(
      () => new PlayerRosterModel([{ id: "player-1" }, { id: "player-1" }]),
    ).toThrow(RangeError);
  });

  it("recovers stamina for every local player", () => {
    const model = new PlayerRosterModel([
      { id: "player-1", maximumStamina: 20, initialStamina: 0 },
      { id: "player-2", maximumStamina: 20, initialStamina: 5 },
    ]);

    model.recoverStamina(3);

    expect(model.getPlayers().map((player) => player.getStamina())).toEqual([
      3, 8,
    ]);
  });
});

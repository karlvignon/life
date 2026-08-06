import { describe, expect, it } from "vitest";
import { TeamManager } from "./main";
import { BLUE_TEAM_ID, RED_TEAM_ID } from "./types";

describe("TeamManager", () => {
  it("registers a player in exactly one team", () => {
    const manager = new TeamManager();

    manager.registerPlayer("player-1", BLUE_TEAM_ID);
    expect(manager.getPlayerTeam("player-1")?.id).toBe(BLUE_TEAM_ID);

    manager.registerPlayer("player-1", RED_TEAM_ID);
    expect(manager.getPlayerTeam("player-1")?.id).toBe(RED_TEAM_ID);
    expect(manager.getTeamSnapshot(BLUE_TEAM_ID)?.playerIds).not.toContain(
      "player-1",
    );
  });

  it("rejects unknown teams and invalid players", () => {
    const manager = new TeamManager();

    expect(() => manager.registerPlayer("player-1", "unknown")).toThrow(
      RangeError,
    );
    expect(() => manager.registerPlayer("   ", BLUE_TEAM_ID)).toThrow(
      RangeError,
    );
  });
});

import { describe, expect, it } from "vitest";
import type { PlayerId } from "../../core/types/player";
import type { TeamResolver } from "../../core/types/team";
import { MapModel } from "./MapModel";
import {
  BLIND_SEEDING_BEHAVIOR_ID,
  BlindSeeding,
} from "./model/behaviors/BlindSeeding";
import { SEED_RANGE_BEHAVIOR_ID, SeedRange } from "./model/behaviors/SeedRange";
import { essenceCatalog } from "./model/essences/EssenceCatalog";
import { StaticEssence } from "./model/essences/StaticEssence";

const BLUE_PLAYER_ID = "blue-player";
const BLUE_TEAMMATE_ID = "blue-teammate";
const RED_PLAYER_ID = "red-player";

const teamResolver: TeamResolver = {
  getPlayerTeam(playerId: PlayerId) {
    if (playerId === BLUE_PLAYER_ID || playerId === BLUE_TEAMMATE_ID) {
      return { id: "blue", label: "Blue", color: 0x3b82f6 };
    }
    if (playerId === RED_PLAYER_ID) {
      return { id: "red", label: "Red", color: 0xef4444 };
    }
    return null;
  },
};

describe("tile seeding behaviors", () => {
  it("uses a non-negative Chebyshev SeedRange", () => {
    const range = new SeedRange(2);

    expect(range.containsOffset(2, 2)).toBe(true);
    expect(range.containsOffset(3, 0)).toBe(false);
    expect(() => new SeedRange(-1)).toThrow(RangeError);
    expect(() => new SeedRange(1.5)).toThrow(RangeError);
  });

  it("lets a living tile receive, replace and remove behaviors", () => {
    const model = new MapModel(3, 3, teamResolver);
    const essence = new StaticEssence();
    model.setCellAlive(1, 1, essence, {
      kind: "player-placement",
      playerId: BLUE_PLAYER_ID,
    });
    const tile = model.getTile(1, 1)!;

    tile.addBehavior(new SeedRange(2));
    tile.addBehavior(new SeedRange(4));
    tile.addBehavior(new BlindSeeding());

    expect(tile.getBehaviors()).toHaveLength(2);
    expect(tile.getBehavior<SeedRange>(SEED_RANGE_BEHAVIOR_ID)?.value).toBe(4);
    expect(tile.removeBehavior(BLIND_SEEDING_BEHAVIOR_ID)).toBe(true);
    expect(tile.removeBehavior(BLIND_SEEDING_BEHAVIOR_ID)).toBe(false);
  });

  it("requires every cell of a placement to be inside allied vision", () => {
    const model = new MapModel(10, 10, teamResolver);
    const essence = new StaticEssence();

    model.setCellAlive(
      5,
      5,
      essence,
      { kind: "player-placement", playerId: BLUE_PLAYER_ID },
      [new SeedRange(1)],
    );

    expect(
      model.canSeedCells(
        [
          { x: 6, y: 5 },
          { x: 7, y: 5 },
        ],
        essence,
        BLUE_TEAMMATE_ID,
      ),
    ).toBe(false);
    expect(
      model.canSeedCells([{ x: 6, y: 6 }], essence, BLUE_TEAMMATE_ID),
    ).toBe(true);
    expect(model.canSeedCells([{ x: 6, y: 6 }], essence, RED_PLAYER_ID)).toBe(
      false,
    );
  });

  it("uses incoming BlindSeeding without bypassing collision rules", () => {
    const model = new MapModel(8, 8, teamResolver);
    const essence = essenceCatalog.get("game-of-life");
    const behaviors = [new SeedRange(4), new BlindSeeding()];

    expect(
      model.seedCells([{ x: 7, y: 7 }], essence, RED_PLAYER_ID, behaviors)
        .changes,
    ).toHaveLength(1);
    expect(model.getTile(7, 7)?.getBehaviors()).toEqual(behaviors);

    model.seedCells([{ x: 7, y: 7 }], essence, RED_PLAYER_ID, [
      new SeedRange(3),
    ]);
    expect(
      model.getTile(7, 7)?.getBehavior<SeedRange>(SEED_RANGE_BEHAVIOR_ID)
        ?.value,
    ).toBe(3);
    expect(
      model.getTile(7, 7)?.getBehavior<BlindSeeding>(BLIND_SEEDING_BEHAVIOR_ID),
    ).toBeNull();

    model.setCellAlive(0, 0, new StaticEssence(), {
      kind: "player-placement",
      playerId: BLUE_PLAYER_ID,
    });
    expect(
      model.canSeedCells([{ x: 0, y: 0 }], essence, RED_PLAYER_ID, behaviors),
    ).toBe(false);
  });

  it("does not duplicate behaviors onto simulation births", () => {
    const model = new MapModel(5, 5, teamResolver);
    const essence = essenceCatalog.get("game-of-life");
    const behaviors = [new SeedRange(4), new BlindSeeding()];

    model.placeCells(
      [
        { x: 1, y: 2 },
        { x: 2, y: 2 },
        { x: 3, y: 2 },
      ],
      essence,
      { kind: "player-placement", playerId: BLUE_PLAYER_ID },
      behaviors,
    );
    model.step(1, {
      cycle: 1,
      season: "Spring",
      windStrength: 12,
      degrees: 25,
    });

    expect(model.getTile(2, 2)?.getBehaviors()).toEqual(behaviors);
    expect(model.getTile(2, 1)?.getBehaviors()).toEqual([]);
    expect(model.getTile(2, 3)?.getBehaviors()).toEqual([]);
  });

  it("builds the selected team's clipped range from empty tiles only", () => {
    const model = new MapModel(5, 5, teamResolver);
    const essence = new StaticEssence();

    model.setCellAlive(
      0,
      0,
      essence,
      { kind: "player-placement", playerId: BLUE_PLAYER_ID },
      [new SeedRange(1)],
    );
    model.setCellAlive(1, 1, essence, {
      kind: "player-placement",
      playerId: RED_PLAYER_ID,
    });

    expect(
      model.createSeedRangeMapSnapshot(BLUE_TEAMMATE_ID).coveredCells,
    ).toEqual([
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ]);
  });
});

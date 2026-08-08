import { describe, expect, it } from "vitest";
import { BlindSeeding } from "./model/behaviors/BlindSeeding";
import { SeedRange } from "./model/behaviors/SeedRange";
import {
  createTileBehaviors,
  TileBehaviorFactory,
} from "./model/behaviors/TileBehaviorFactory";

describe("TileBehaviorFactory", () => {
  it("creates the concrete behaviors declared by a card", () => {
    const behaviors = createTileBehaviors([
      { type: "seed-range", value: 4 },
      { type: "blind-seeding" },
    ]);

    expect(behaviors[0]).toBeInstanceOf(SeedRange);
    expect((behaviors[0] as SeedRange).value).toBe(4);
    expect(behaviors[1]).toBeInstanceOf(BlindSeeding);
  });

  it("rejects duplicate creators", () => {
    expect(
      () =>
        new TileBehaviorFactory([
          ["blind-seeding", () => new BlindSeeding()],
          ["blind-seeding", () => new BlindSeeding()],
        ]),
    ).toThrow(RangeError);
  });
});

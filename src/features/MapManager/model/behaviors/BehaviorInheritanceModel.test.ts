import { describe, expect, it, vi } from "vitest";
import { StaticEssence } from "../essences/StaticEssence";
import { Tile } from "../Tile";
import { BlindSeeding } from "./BlindSeeding";
import { BehaviorInheritanceModel } from "./BehaviorInheritanceModel";
import { SeedRange } from "./SeedRange";
import { TileBehavior } from "./TileBehavior";

class TestBehavior extends TileBehavior {
  constructor(
    readonly id: string,
    readonly inheritable: boolean,
  ) {
    super();
  }
}

describe("BehaviorInheritanceModel", () => {
  it("inherits every inheritable behavior from the parent paying the most", () => {
    const randomSource = vi.fn(() => 0);
    const model = new BehaviorInheritanceModel({
      paymentTieBreakerRandomSource: randomSource,
    });
    const newborn = createCell(0, 0);
    const inheritedRange = new SeedRange(4);
    const inheritedCustomBehavior = new TestBehavior("custom", true);
    const excludedBehavior = new BlindSeeding();
    const mainContributor = createCell(1, 0, [
      inheritedRange,
      inheritedCustomBehavior,
      excludedBehavior,
    ]);
    const otherParent = createCell(2, 0, [new SeedRange(2)]);

    model.inheritBehaviors(newborn, [
      { cell: mainContributor, paidPoints: 3 },
      { cell: otherParent, paidPoints: 1 },
    ]);

    expect(newborn.getBehaviors()).toEqual([
      inheritedRange,
      inheritedCustomBehavior,
    ]);
    expect(randomSource).not.toHaveBeenCalled();
  });

  it("randomly chooses one parent when their payments are equal", () => {
    const model = new BehaviorInheritanceModel({
      paymentTieBreakerRandomSource: () => 0.999,
    });
    const newborn = createCell(0, 0);
    const firstRange = new SeedRange(2);
    const secondRange = new SeedRange(5);

    model.inheritBehaviors(newborn, [
      { cell: createCell(1, 0, [firstRange]), paidPoints: 1 },
      { cell: createCell(2, 0, [secondRange]), paidPoints: 1 },
    ]);

    expect(newborn.getBehaviors()).toEqual([secondRange]);
  });
});

function createCell(
  x: number,
  y: number,
  behaviors: ReadonlyArray<TileBehavior> = [],
): Tile {
  const cell = new Tile(x, y);
  cell.makeAlive({
    essence: new StaticEssence(),
    provenance: { kind: "player-placement", playerId: "test-player" },
    behaviors,
  });
  return cell;
}

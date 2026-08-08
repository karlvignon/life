import { describe, expect, it } from "vitest";
import {
  BehaviorInheritanceScore,
  LifecycleEffectsBehavior,
  StaticEssence,
} from "../MapManager/main";
import { CardFactory } from "./CardFactory";

describe("CardFactory", () => {
  const essence = new StaticEssence();
  const factory = new CardFactory([{ id: "static", label: "Static", essence }]);

  it("resolves every runtime dependency from one card definition", () => {
    const card = factory.create({
      familyId: "static",
      patternId: "start",
      label: "START",
      staminaCost: 1,
      behaviors: [{ type: "seed-range", value: 4 }, { type: "blind-seeding" }],
    });

    expect(card.familyId).toBe("static");
    expect(card.pattern.id).toBe("start");
    expect(card.essence).toBe(essence);
    expect(card.behaviors.map(({ id }) => id)).toEqual([
      "seed-range",
      "blind-seeding",
    ]);
  });

  it("rejects unknown essence families", () => {
    expect(() =>
      factory.create({
        familyId: "unknown",
        patternId: "cell",
        label: "Cell",
        staminaCost: 1,
      }),
    ).toThrow("Unknown essence family");
  });

  it("resolves lifecycle hooks declared by a card", () => {
    const card = factory.create({
      familyId: "static",
      patternId: "cell",
      label: "Volatile cell",
      staminaCost: 2,
      behaviors: [
        {
          type: "lifecycle-effects",
          id: "volatile",
          inheritableScore: BehaviorInheritanceScore.NONE,
          onDeath: [
            {
              type: "damage",
              target: { offsetX: 1, offsetY: 0 },
              amount: 20,
            },
          ],
        },
      ],
    });

    expect(card.behaviors[0]).toBeInstanceOf(LifecycleEffectsBehavior);
    expect(card.behaviors[0].id).toBe("volatile");
  });
});

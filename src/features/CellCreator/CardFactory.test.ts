import { describe, expect, it } from "vitest";
import { StaticEssence } from "../MapManager/main";
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
});

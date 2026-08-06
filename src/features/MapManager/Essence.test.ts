import { describe, expect, it } from "vitest";
import { Essence } from "./model/essences/Essence";
import { StaticEssence } from "./model/essences/StaticEssence";

describe("Essence", () => {
  it("defines the default effective properties", () => {
    expect(new StaticEssence().getInitialProperties()).toEqual({
      life: 100,
      maximumLife: 100,
      reproducibility: 10,
    });
  });

  it("configures properties and reproduction without inheritance", () => {
    const essence = new Essence({
      id: "durable",
      name: "Durable",
      color: 0xffffff,
      initialProperties: {
        life: 250,
        maximumLife: 300,
        reproducibility: 25,
      },
      reproductionCost: 2,
    });

    expect(essence.getInitialProperties()).toEqual({
      life: 250,
      maximumLife: 300,
      reproducibility: 25,
    });
    expect(essence.createTileData().toProperties()).toEqual({
      life: 250,
      maximumLife: 300,
      reproducibility: 25,
    });
    expect(essence.getReproductionCost()).toBe(2);
  });

  it("rejects duplicate behavior ids", () => {
    const behavior = { id: "duplicate", evaluate: () => ({}) };

    expect(
      () =>
        new Essence({
          id: "invalid",
          name: "Invalid",
          color: 0,
          evolutionBehaviors: [behavior, behavior],
        }),
    ).toThrow(RangeError);
  });
});

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

  it("defaults its evolution family to its id", () => {
    const essence = new Essence({
      id: "default-family",
      name: "Default family",
      color: 0,
    });

    expect(essence.evolutionFamilyId).toBe("default-family");
    expect(essence.evolutionPriority).toBe(0);
  });

  it("keeps same-cell behavior proposals separate and ordered", () => {
    const essence = new Essence({
      id: "ordered",
      evolutionFamilyId: "family",
      evolutionPriority: 2,
      name: "Ordered",
      color: 0,
      evolutionBehaviors: [
        {
          id: "first",
          evaluate: () => ({
            births: [{ index: 7, parentIndices: [1] }],
          }),
        },
        {
          id: "second",
          evaluate: () => ({
            births: [{ index: 7, parentIndices: [2] }],
          }),
        },
      ],
    });

    const result = essence.evolve({
      bounds: { width: 5, height: 5 },
      aliveIndices: new Set([1, 2]),
      essenceIndices: new Set([1, 2]),
      globalLivingIndices: new Set([1, 2]),
      currentCycle: 1,
    });

    expect(result.births).toEqual([
      { index: 7, parentIndices: [1] },
      { index: 7, parentIndices: [2] },
    ]);
    expect(essence.evolutionPriority).toBe(2);
  });

  it("rejects invalid evolution orchestration metadata", () => {
    expect(
      () =>
        new Essence({
          id: "invalid-family",
          evolutionFamilyId: " ",
          name: "Invalid family",
          color: 0,
        }),
    ).toThrow(RangeError);
    expect(
      () =>
        new Essence({
          id: "invalid-priority",
          evolutionPriority: -1,
          name: "Invalid priority",
          color: 0,
        }),
    ).toThrow(RangeError);
  });
});

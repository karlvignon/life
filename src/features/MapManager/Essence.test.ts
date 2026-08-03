import { describe, expect, it } from "vitest";
import { StaticEssence } from "./model/essences/StaticEssence";

describe("Essence", () => {
  it("defines 100 initial life by default", () => {
    expect(new StaticEssence().getInitialProperties()).toEqual({
      life: 100,
      maximumLife: 100,
    });
  });

  it("allows concrete essences to redefine initial properties", () => {
    class DurableEssence extends StaticEssence {
      protected override readonly defaultTileData = {
        life: 250,
        maximumLife: 300,
      };
    }

    const essence = new DurableEssence();

    expect(essence.getInitialProperties()).toEqual({
      life: 250,
      maximumLife: 300,
    });
    expect(essence.createTileData().toProperties()).toEqual({
      life: 250,
      maximumLife: 300,
    });
  });
});

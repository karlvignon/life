import { describe, expect, it } from "vitest";
import { StaticEssence } from "./model/essences/StaticEssence";
import { Tile } from "./model/Tile";
import { TileData } from "./model/TileData";
import { TEST_PROVENANCE } from "./testFixtures";

describe("TileData", () => {
  it("initializes every effective property from one shared input contract", () => {
    const data = new TileData({
      life: 80,
      maximumLife: 120,
      reproducibility: 10,
    });

    expect(data.getLife()).toBe(80);
    expect(data.getMaximumLife()).toBe(120);
    expect(data.getReproducibility()).toBe(10);
    expect(data.toProperties()).toEqual({
      life: 80,
      maximumLife: 120,
      reproducibility: 10,
    });
  });

  it("applies independent deltas to effective properties", () => {
    const data = new TileData({
      life: 80,
      maximumLife: 120,
      reproducibility: 10,
    });

    data.apply({ life: -10, maximumLife: 30, reproducibility: -2 });

    expect(data.toProperties()).toEqual({
      life: 70,
      maximumLife: 150,
      reproducibility: 8,
    });
  });

  it("creates independent data instances for tiles of the same essence", () => {
    const essence = new StaticEssence();
    const first = new Tile(1, 1);
    const second = new Tile(2, 2);
    first.makeAlive({ essence, provenance: TEST_PROVENANCE });
    second.makeAlive({ essence, provenance: TEST_PROVENANCE });

    first.getData()?.apply({ life: -40 });

    expect(first.getData()).toBeInstanceOf(TileData);
    expect(second.getData()).toBeInstanceOf(TileData);
    expect(first.getData()).not.toBe(second.getData());
    expect(first.getData()?.getLife()).toBe(60);
    expect(second.getData()?.getLife()).toBe(100);
  });

  it("removes effective data when its tile dies", () => {
    const tile = new Tile(1, 1);
    tile.makeAlive({
      essence: new StaticEssence(),
      provenance: TEST_PROVENANCE,
    });

    tile.kill();

    expect(tile.getData()).toBeNull();
    expect(tile.getProvenance()).toBeNull();
  });

  it("keeps effective properties nested in the tile snapshot", () => {
    const essence = new StaticEssence();
    const tile = new Tile(1, 2);
    tile.makeAlive({ essence, provenance: TEST_PROVENANCE });

    expect(tile.toSnapshot()).toEqual({
      x: 1,
      y: 2,
      alive: true,
      essence,
      data: {
        life: 100,
        maximumLife: 100,
        reproducibility: 10,
      },
      provenance: TEST_PROVENANCE,
      behaviors: [],
      rotation: 0,
    });
  });

  it("requires a non-empty owner for every living tile", () => {
    const tile = new Tile(1, 2);

    expect(() =>
      tile.makeAlive({
        essence: new StaticEssence(),
        provenance: { kind: "player-placement", playerId: "   " },
      }),
    ).toThrow(RangeError);
    expect(tile.isAlive()).toBe(false);
  });

  it("validates constructor values", () => {
    expect(
      () =>
        new TileData({
          life: Number.NaN,
          maximumLife: 100,
          reproducibility: 10,
        }),
    ).toThrow(RangeError);
    expect(
      () => new TileData({ life: 100, maximumLife: -1, reproducibility: 10 }),
    ).toThrow(RangeError);
    expect(
      () =>
        new TileData({
          life: 100,
          maximumLife: 100,
          reproducibility: Number.NaN,
        }),
    ).toThrow(RangeError);
  });

  it("rejects invalid deltas without partially mutating its data", () => {
    const data = new TileData({
      life: 80,
      maximumLife: 100,
      reproducibility: 10,
    });

    expect(() => data.apply({ life: -10, maximumLife: -101 })).toThrow(
      RangeError,
    );
    expect(data.toProperties()).toEqual({
      life: 80,
      maximumLife: 100,
      reproducibility: 10,
    });
  });
});

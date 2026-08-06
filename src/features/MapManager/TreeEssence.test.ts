import { describe, expect, it } from "vitest";
import { MapModel } from "./MapModel";
import { StaticEssence } from "./model/essences/StaticEssence";
import {
  DEFAULT_TREE_COLOR,
  TREE_BIRTH_PATTERN,
  TREE_NEIGHBOR_DEGREES_MODIFIER,
  TreeEssence,
} from "./model/essences/TreeEssence";
import { applyModifiers } from "./model/modifiers/Modifier";
import { setTestCellAlive } from "./testFixtures";

function weatherForCycle(cycle: number) {
  return Object.freeze({
    cycle,
    season: "Spring" as const,
    windStrength: 12,
    degrees: 25,
  });
}

describe("TreeEssence", () => {
  it("keeps isolated cells alive and uses its default green color", () => {
    const essence = new TreeEssence();
    const aliveIndices = new Set([12]);

    expect(essence.color).toBe(DEFAULT_TREE_COLOR);
    expect(
      essence.evolve({
        bounds: { width: 5, height: 5 },
        aliveIndices,
        essenceIndices: aliveIndices,
        currentCycle: 1,
        globalLivingIndices: aliveIndices,
      }).aliveIndices,
    ).toEqual([12]);
  });

  it("births a tree from four diagonal trees", () => {
    const essence = new TreeEssence();
    const model = new MapModel(9, 9);
    const center = { x: 4, y: 4 };

    for (const offset of TREE_BIRTH_PATTERN) {
      setTestCellAlive(
        model,
        center.x + offset.x,
        center.y + offset.y,
        essence,
      );
    }

    model.step(1, weatherForCycle(1));

    expect(model.getTile(center.x, center.y)?.getEssence()).toBe(essence);
  });

  it("adds one temperature modifier to each orthogonal neighbor at birth", () => {
    const model = new MapModel(5, 5);
    const tree = new TreeEssence();
    setTestCellAlive(model, 2, 2, tree);

    for (const [x, y] of [
      [2, 1],
      [3, 2],
      [2, 3],
      [1, 2],
    ]) {
      const tile = model.getTile(x, y);
      expect(tile?.getModifiers()).toHaveLength(1);
      expect(
        applyModifiers(weatherForCycle(1), tile?.getModifiers() ?? []).degrees,
      ).toBe(25 + TREE_NEIGHBOR_DEGREES_MODIFIER);
    }

    expect(model.getTile(2, 2)?.getModifiers()).toHaveLength(0);
    expect(model.getTile(1, 1)?.getModifiers()).toHaveLength(0);
  });

  it("does not reapply birth modifiers to an already living tree", () => {
    const model = new MapModel(5, 5);
    const tree = new TreeEssence();

    setTestCellAlive(model, 2, 2, tree);
    setTestCellAlive(model, 2, 2, tree);

    expect(model.getTile(2, 1)?.getModifiers()).toHaveLength(1);
  });

  it("stacks modifiers from different tree cells", () => {
    const model = new MapModel(5, 5);
    const tree = new TreeEssence();
    setTestCellAlive(model, 1, 2, tree);
    setTestCellAlive(model, 3, 2, tree);

    const sharedNeighbor = model.getTile(2, 2);
    expect(sharedNeighbor?.getModifiers()).toHaveLength(2);
    expect(
      applyModifiers(weatherForCycle(1), sharedNeighbor?.getModifiers() ?? [])
        .degrees,
    ).toBe(25 + TREE_NEIGHBOR_DEGREES_MODIFIER * 2);
  });

  it("removes only the modifiers authored by a replaced tree", () => {
    const model = new MapModel(5, 5);
    const tree = new TreeEssence();
    setTestCellAlive(model, 1, 2, tree);
    setTestCellAlive(model, 3, 2, tree);

    setTestCellAlive(model, 1, 2, new StaticEssence());

    const sharedNeighbor = model.getTile(2, 2);
    expect(sharedNeighbor?.getModifiers()).toHaveLength(1);
    expect(
      applyModifiers(weatherForCycle(1), sharedNeighbor?.getModifiers() ?? [])
        .degrees,
    ).toBe(25 + TREE_NEIGHBOR_DEGREES_MODIFIER);
  });

  it("passes the tile's modified weather to its living essence", () => {
    class WeatherRecordingEssence extends StaticEssence {
      receivedDegrees: number | null = null;

      getWeatherRepercussion(weather: { degrees: number }): { life: number } {
        this.receivedDegrees = weather.degrees;
        return { life: 0 };
      }
    }

    const model = new MapModel(5, 5);
    const weatherRecordingEssence = new WeatherRecordingEssence();
    setTestCellAlive(model, 2, 2, new TreeEssence());
    setTestCellAlive(model, 2, 1, weatherRecordingEssence);

    model.step(1, weatherForCycle(1));

    expect(weatherRecordingEssence.receivedDegrees).toBe(
      25 + TREE_NEIGHBOR_DEGREES_MODIFIER,
    );
  });

  it("removes authored modifiers when weather kills the tree", () => {
    class DyingTreeEssence extends TreeEssence {
      getWeatherRepercussion(): { life: number } {
        return { life: -100 };
      }
    }

    const model = new MapModel(5, 5);
    setTestCellAlive(model, 2, 2, new DyingTreeEssence());

    model.step(1, weatherForCycle(1));

    expect(model.getTile(2, 2)?.isAlive()).toBe(false);
    expect(model.getTile(2, 1)?.getModifiers()).toHaveLength(0);
  });

  it("ignores neighbor modifiers outside the grid", () => {
    const model = new MapModel(3, 3);
    setTestCellAlive(model, 0, 0, new TreeEssence());

    const modifierCount = [
      model.getTile(1, 0),
      model.getTile(0, 1),
      model.getTile(1, 1),
    ].reduce((total, tile) => total + (tile?.getModifiers().length ?? 0), 0);

    expect(modifierCount).toBe(2);
  });

  it("rebuilds modifiers for surviving trees after a resize", () => {
    const model = new MapModel(5, 5);
    setTestCellAlive(model, 2, 2, new TreeEssence());

    model.resize(6, 6);

    expect(model.getTile(2, 1)?.getModifiers()).toHaveLength(1);
    expect(
      applyModifiers(
        weatherForCycle(1),
        model.getTile(2, 1)?.getModifiers() ?? [],
      ).degrees,
    ).toBe(25 + TREE_NEIGHBOR_DEGREES_MODIFIER);
  });
});

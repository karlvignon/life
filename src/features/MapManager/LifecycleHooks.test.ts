import { describe, expect, it } from "vitest";
import { MapModel } from "./MapModel";
import { LifecycleEffectsBehavior } from "./model/behaviors/LifecycleEffectsBehavior";
import { BehaviorInheritanceScore } from "./model/behaviors/TileBehavior";
import { GameOfLifeEssence } from "./model/essences/GameOfLifeEssence";
import { StaticEssence } from "./model/essences/StaticEssence";
import { TEST_PROVENANCE } from "./testFixtures";

function weatherForCycle(cycle: number) {
  return Object.freeze({
    cycle,
    season: "Spring" as const,
    windStrength: 10,
    degrees: 20,
  });
}

describe("tile lifecycle hooks", () => {
  it("materializes a whole placement before running birth hooks", () => {
    const model = new MapModel(5, 5);
    const essence = new StaticEssence();
    const behavior = new LifecycleEffectsBehavior({
      type: "lifecycle-effects",
      id: "damage-right-on-birth",
      inheritableScore: BehaviorInheritanceScore.NONE,
      onBirth: [
        {
          type: "damage",
          target: { offsetX: 1, offsetY: 0 },
          amount: 10,
        },
      ],
    });

    model.placeCells(
      [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
      essence,
      TEST_PROVENANCE,
      [behavior],
    );

    expect(model.getTile(2, 1)?.getData()?.getLife()).toBe(90);
  });

  it("runs cycle and death hooks and lets death effects spawn an essence", () => {
    const model = new MapModel(5, 5);
    const behavior = new LifecycleEffectsBehavior({
      type: "lifecycle-effects",
      id: "die-and-spawn",
      inheritableScore: BehaviorInheritanceScore.NONE,
      onCycle: {
        effects: [
          {
            type: "damage",
            target: { offsetX: 0, offsetY: 0 },
            amount: 100,
          },
        ],
      },
      onDeath: [
        {
          type: "spawn-essence",
          target: { offsetX: 1, offsetY: 0 },
          essenceId: "static",
        },
      ],
    });

    model.setCellAlive(1, 1, new StaticEssence(), TEST_PROVENANCE, [behavior]);
    model.step(1, weatherForCycle(1));

    expect(model.getTile(1, 1)?.isAlive()).toBe(false);
    expect(model.getTile(2, 1)?.getEssence()?.id).toBe("static");
    expect(model.getTile(2, 1)?.getBehaviors()).toEqual([]);
  });

  it("removes source-bound modifiers when their source dies", () => {
    const model = new MapModel(5, 5);
    const essence = new StaticEssence();
    const behavior = new LifecycleEffectsBehavior({
      type: "lifecycle-effects",
      id: "temporary-aura",
      inheritableScore: BehaviorInheritanceScore.NONE,
      onBirth: [
        {
          type: "modifier:add",
          target: { offsetX: 1, offsetY: 0 },
          key: "temporary-cold",
          property: "degrees",
          mode: "absolute",
          value: -5,
        },
      ],
      onCycle: {
        effects: [
          {
            type: "damage",
            target: { offsetX: 0, offsetY: 0 },
            amount: 100,
          },
        ],
      },
    });

    model.setCellAlive(2, 1, essence, TEST_PROVENANCE);
    model.setCellAlive(1, 1, essence, TEST_PROVENANCE, [behavior]);
    expect(model.getModifiers(2, 1)).toHaveLength(1);

    model.step(1, weatherForCycle(1));

    expect(model.getModifiers(2, 1)).toHaveLength(0);
  });

  it("lets a cycle hook explicitly remove one of its modifiers", () => {
    const model = new MapModel(5, 5);
    const essence = new StaticEssence();
    const behavior = new LifecycleEffectsBehavior({
      type: "lifecycle-effects",
      id: "temporary-wind",
      inheritableScore: BehaviorInheritanceScore.NONE,
      onBirth: [
        {
          type: "modifier:add",
          target: { offsetX: 1, offsetY: 0 },
          key: "temporary-wind",
          property: "windStrength",
          mode: "absolute",
          value: 5,
        },
      ],
      onCycle: {
        effects: [
          {
            type: "modifier:remove",
            target: { offsetX: 1, offsetY: 0 },
            key: "temporary-wind",
          },
        ],
      },
    });

    model.setCellAlive(2, 1, essence, TEST_PROVENANCE);
    model.setCellAlive(1, 1, essence, TEST_PROVENANCE, [behavior]);
    expect(model.getModifiers(2, 1)).toHaveLength(1);

    model.step(1, weatherForCycle(1));

    expect(model.getModifiers(2, 1)).toHaveLength(0);
  });

  it("allows a permanent modifier emitted by a death hook to outlive its source", () => {
    const model = new MapModel(5, 5);
    const essence = new StaticEssence();
    const behavior = new LifecycleEffectsBehavior({
      type: "lifecycle-effects",
      id: "death-scar",
      inheritableScore: BehaviorInheritanceScore.NONE,
      onCycle: {
        effects: [
          {
            type: "damage",
            target: { offsetX: 0, offsetY: 0 },
            amount: 100,
          },
        ],
      },
      onDeath: [
        {
          type: "modifier:add",
          target: { offsetX: 1, offsetY: 0 },
          key: "death-scar",
          property: "degrees",
          mode: "absolute",
          value: -3,
          lifetime: { type: "permanent" },
        },
      ],
    });

    model.setCellAlive(2, 1, essence, TEST_PROVENANCE);
    model.setCellAlive(1, 1, essence, TEST_PROVENANCE, [behavior]);
    model.step(1, weatherForCycle(1));

    expect(model.getModifiers(2, 1)).toHaveLength(1);
  });

  it("decrements a finite behavior score on simulation births", () => {
    const model = new MapModel(5, 5);
    const essence = new GameOfLifeEssence();
    const behavior = new LifecycleEffectsBehavior({
      type: "lifecycle-effects",
      id: "one-generation-mark",
      inheritableScore: 1,
    });

    model.placeCells(
      [
        { x: 1, y: 2 },
        { x: 2, y: 2 },
        { x: 3, y: 2 },
      ],
      essence,
      TEST_PROVENANCE,
      [behavior],
    );
    model.step(1, weatherForCycle(1));

    expect(model.getTile(2, 1)?.getBehaviors()[0]?.inheritableScore).toBe(
      BehaviorInheritanceScore.NONE,
    );
    expect(model.getTile(2, 3)?.getBehaviors()[0]?.inheritableScore).toBe(
      BehaviorInheritanceScore.NONE,
    );
    expect(model.getTile(2, 2)?.getBehaviors()[0]?.inheritableScore).toBe(1);
  });
});

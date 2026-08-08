import { describe, expect, it } from "vitest";
import { Essence } from "../essences/Essence";
import { resolveBirthCompetition } from "./BirthCompetitionResolver";
import type { EssenceGeneration, LivingCellEntry } from "./types";

describe("BirthCompetitionResolver", () => {
  const target = 12;

  function createEssence(id: string, cost = 1): Essence {
    return new Essence({
      id,
      name: id,
      color: 0xffffff,
      reproductionCost: cost,
    });
  }

  function cell(
    index: number,
    essence: Essence,
    playerId: string,
    teamId: string,
    reproducibility = 10,
  ): LivingCellEntry {
    return { index, essence, playerId, teamId, reproducibility };
  }

  function generation(
    essence: Essence,
    teamId: string,
    parentIndices: number[],
  ): EssenceGeneration {
    return {
      essence,
      teamId,
      inputIndices: new Set(parentIndices),
      outputIndices: [target],
      outputSet: new Set([target]),
      births: [{ index: target, parentIndices }],
    };
  }

  it("lets the team with more unique parents win and charges only it", () => {
    const blue = createEssence("blue");
    const red = createEssence("red");
    const living = [
      cell(1, blue, "blue-1", "blue"),
      cell(2, blue, "blue-2", "blue"),
      cell(3, red, "red-1", "red"),
    ];

    const result = resolveBirthCompetition(
      [generation(blue, "blue", [1, 2]), generation(red, "red", [3])],
      living,
      1,
    );

    expect(result.acceptedBirths.get(target)?.teamId).toBe("blue");
    expect(result.reproductionCosts).toEqual(
      new Map([
        [1, 1],
        [2, 1],
      ]),
    );
    expect(result.reproductionCosts.has(3)).toBe(false);
  });

  it("cancels an exact tie between teams without charging parents", () => {
    const blue = createEssence("blue");
    const red = createEssence("red");
    const living = [
      cell(1, blue, "blue-1", "blue"),
      cell(2, red, "red-1", "red"),
    ];

    const result = resolveBirthCompetition(
      [generation(blue, "blue", [1]), generation(red, "red", [2])],
      living,
      1,
    );

    expect(result.acceptedBirths.size).toBe(0);
    expect(result.reproductionCosts.size).toBe(0);
  });

  it("assigns an allied birth to the player contributing most parents", () => {
    const essence = createEssence("allied");
    const living = [
      cell(1, essence, "player-1", "blue"),
      cell(2, essence, "player-1", "blue"),
      cell(3, essence, "player-2", "blue"),
    ];

    const result = resolveBirthCompetition(
      [generation(essence, "blue", [1, 2, 3])],
      living,
      1,
    );

    expect(result.acceptedBirths.get(target)?.playerId).toBe("player-1");
    expect(result.reproductionCosts.size).toBe(3);
  });

  it("records the payment made by every parent for behavior inheritance", () => {
    const essence = createEssence("allied");
    const living = [
      cell(1, essence, "player-1", "blue"),
      cell(2, essence, "player-2", "blue"),
    ];
    const result = resolveBirthCompetition(
      [generation(essence, "blue", [1, 2])],
      living,
      1,
    );

    expect(result.acceptedBirths.get(target)?.parentContributions).toEqual([
      { index: 1, paidPoints: 1 },
      { index: 2, paidPoints: 1 },
    ]);
  });

  it("uses total reproducibility to break an equal player contribution", () => {
    const essence = createEssence("allied");
    const living = [
      cell(1, essence, "player-1", "blue", 4),
      cell(2, essence, "player-2", "blue", 8),
    ];

    const result = resolveBirthCompetition(
      [generation(essence, "blue", [1, 2])],
      living,
      1,
    );

    expect(result.acceptedBirths.get(target)?.playerId).toBe("player-2");
  });

  it("falls back to the next same-team proposal when priority cannot pay", () => {
    const priority = createEssence("priority", 2);
    const fallback = createEssence("fallback", 1);
    const living = [
      cell(1, priority, "player-1", "blue", 1),
      cell(2, fallback, "player-1", "blue", 5),
    ];

    const result = resolveBirthCompetition(
      [generation(priority, "blue", [1]), generation(fallback, "blue", [2])],
      living,
      1,
    );

    expect(result.acceptedBirths.get(target)?.essence).toBe(fallback);
    expect(result.reproductionCosts).toEqual(new Map([[2, 1]]));
  });
});

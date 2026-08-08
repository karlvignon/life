import { describe, expect, it } from "vitest";
import { GameOfLifeEssence } from "../essences/GameOfLifeEssence";
import { mergeGenerations } from "./GenerationMerger";
import type {
  AcceptedBirth,
  EssenceGeneration,
  LivingCellEntry,
} from "./types";

describe("GenerationMerger", () => {
  const essenceA = new GameOfLifeEssence();
  const essenceB = new GameOfLifeEssence();
  const playerId = "player-1";
  const teamId = "team-1";

  function generation(
    essence: GameOfLifeEssence,
    input: number[],
    output: number[],
    team = teamId,
  ): EssenceGeneration {
    return {
      essence,
      teamId: team,
      inputIndices: new Set(input),
      outputIndices: output,
      outputSet: new Set(output),
    };
  }

  function living(index: number, essence = essenceA): LivingCellEntry {
    return {
      index,
      essence,
      reproducibility: 10,
      playerId,
      teamId,
    };
  }

  function birth(index: number, essence = essenceA): AcceptedBirth {
    return {
      index,
      essence,
      playerId,
      teamId,
      parentIndices: [1],
      parentContributions: [{ index: 1, paidPoints: 1 }],
      rotation: 0,
    };
  }

  it("keeps a survivor with its original essence", () => {
    const merged = mergeGenerations(
      [living(5)],
      [generation(essenceA, [5], [5])],
      new Map(),
    );

    expect(merged.get(5)).toBe(essenceA);
  });

  it("drops a cell absent from its generation output", () => {
    const merged = mergeGenerations(
      [living(5)],
      [generation(essenceA, [5], [])],
      new Map(),
    );

    expect(merged.has(5)).toBe(false);
  });

  it("applies only births accepted by the competition resolver", () => {
    const merged = mergeGenerations(
      [],
      [generation(essenceA, [], [7]), generation(essenceB, [], [8])],
      new Map([[8, birth(8, essenceB)]]),
    );

    expect(merged.has(7)).toBe(false);
    expect(merged.get(8)).toBe(essenceB);
  });

  it("does not replace a survivor with an accepted birth", () => {
    const merged = mergeGenerations(
      [living(5)],
      [generation(essenceA, [5], [5])],
      new Map([[5, birth(5, essenceB)]]),
    );

    expect(merged.get(5)).toBe(essenceA);
  });
});

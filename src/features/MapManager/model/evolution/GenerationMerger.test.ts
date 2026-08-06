import { describe, expect, it } from "vitest";
import { GameOfLifeEssence } from "../essences/GameOfLifeEssence";
import { mergeGenerations } from "./GenerationMerger";
import type { EssenceGeneration, LivingCellEntry } from "./types";

describe("GenerationMerger", () => {
  const essenceA = new GameOfLifeEssence();
  const essenceB = new GameOfLifeEssence();
  const playerId = "player-1";

  function generation(
    essence: GameOfLifeEssence,
    input: number[],
    output: number[],
    owner = playerId,
  ): EssenceGeneration {
    return {
      essence,
      playerId: owner,
      inputIndices: new Set(input),
      outputIndices: output,
      outputSet: new Set(output),
    };
  }

  it("keeps survivor with original essence", () => {
    const living: LivingCellEntry[] = [
      { index: 5, essence: essenceA, reproducibility: 10, playerId },
    ];
    const merged = mergeGenerations(
      living,
      [generation(essenceA, [5], [5])],
      [essenceA],
    );

    expect(merged.get(5)).toBe(essenceA);
  });

  it("drops cells absent from output", () => {
    const living: LivingCellEntry[] = [
      { index: 5, essence: essenceA, reproducibility: 10, playerId },
    ];
    const merged = mergeGenerations(
      living,
      [generation(essenceA, [5], [])],
      [essenceA],
    );

    expect(merged.has(5)).toBe(false);
  });

  it("assigns birth to generating essence", () => {
    const merged = mergeGenerations(
      [],
      [generation(essenceA, [], [10])],
      [essenceA],
    );

    expect(merged.get(10)).toBe(essenceA);
  });

  it("survivor blocks concurrent birth", () => {
    const living: LivingCellEntry[] = [
      { index: 5, essence: essenceA, reproducibility: 10, playerId },
    ];
    const merged = mergeGenerations(
      living,
      [generation(essenceA, [5], [5]), generation(essenceB, [5], [5])],
      [essenceA, essenceB],
    );

    expect(merged.get(5)).toBe(essenceA);
  });

  it("resolves concurrent births with essence order", () => {
    const merged = mergeGenerations(
      [],
      [generation(essenceA, [], [7]), generation(essenceB, [], [7])],
      [essenceA, essenceB],
    );

    expect(merged.get(7)).toBe(essenceA);
  });

  it("rejects a birth contested by different players", () => {
    const merged = mergeGenerations(
      [],
      [
        generation(essenceA, [], [7], playerId),
        generation(essenceA, [], [7], "player-2"),
      ],
      [essenceA],
    );

    expect(merged.has(7)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { packIndex } from "../../../../core/types/grid";
import { GameOfLifeEssence } from "../essences/GameOfLifeEssence";
import {
  Essence,
  type EssenceEvolutionInput,
  type EssenceEvolutionResult,
} from "../essences/Essence";
import { computeNextGeneration } from "./EvolutionEngine";

describe("EvolutionEngine", () => {
  const essence = new GameOfLifeEssence();
  const bounds = { width: 5, height: 5 };

  it("oscillates a horizontal blinker to vertical", () => {
    const living = [
      { index: packIndex(1, 2, bounds.width), essence },
      { index: packIndex(2, 2, bounds.width), essence },
      { index: packIndex(3, 2, bounds.width), essence },
    ];

    const { nextLiving } = computeNextGeneration({
      bounds,
      living,
      currentCycle: 1,
      essenceOrder: [essence],
    });

    const coords = [...nextLiving.keys()]
      .map((index) => ({
        x: index % bounds.width,
        y: Math.floor(index / bounds.width),
      }))
      .sort((a, b) => a.x - b.x || a.y - b.y);

    expect(coords).toEqual([
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
    ]);
  });

  it("keeps weather outside essence evolution inputs", () => {
    const receivedInputs: EssenceEvolutionInput[] = [];
    class InputRecordingEssence extends Essence {
      constructor(
        readonly color: number,
        private readonly receivedInputs: EssenceEvolutionInput[],
      ) {
        super();
      }

      evolve(input: EssenceEvolutionInput): EssenceEvolutionResult {
        this.receivedInputs.push(input);
        return { aliveIndices: [...input.aliveIndices] };
      }
    }

    const firstEssence = new InputRecordingEssence(0x111111, receivedInputs);
    const secondEssence = new InputRecordingEssence(0x222222, receivedInputs);

    computeNextGeneration({
      bounds,
      living: [
        { index: packIndex(1, 1, bounds.width), essence: firstEssence },
        { index: packIndex(3, 3, bounds.width), essence: secondEssence },
      ],
      currentCycle: 4,
      essenceOrder: [firstEssence, secondEssence],
    });

    expect(receivedInputs).toHaveLength(2);
    expect(receivedInputs.every((input) => !("weather" in input))).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { packIndex } from "../../../../core/types/grid";
import { GameOfLifeEssence } from "../essences/GameOfLifeEssence";
import type {
  Essence,
  EssenceEvolutionInput,
  EssenceEvolutionResult,
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
      weather: {
        cycle: 1,
        season: "Spring",
        windStrength: 12,
        degrees: 20,
      },
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

  it("shares the exact weather snapshot with every essence group", () => {
    const receivedWeather: EssenceEvolutionInput["weather"][] = [];
    const makeEssence = (color: number): Essence => ({
      color,
      evolve(input: EssenceEvolutionInput): EssenceEvolutionResult {
        receivedWeather.push(input.weather);
        return { aliveIndices: [...input.aliveIndices] };
      },
    });
    const firstEssence = makeEssence(0x111111);
    const secondEssence = makeEssence(0x222222);
    const weather = Object.freeze({
      cycle: 4,
      season: "Spring" as const,
      windStrength: 28,
      degrees: 6,
    });

    computeNextGeneration({
      bounds,
      living: [
        { index: packIndex(1, 1, bounds.width), essence: firstEssence },
        { index: packIndex(3, 3, bounds.width), essence: secondEssence },
      ],
      currentCycle: 4,
      weather,
      essenceOrder: [firstEssence, secondEssence],
    });

    expect(receivedWeather).toHaveLength(2);
    expect(receivedWeather[0]).toBe(weather);
    expect(receivedWeather[1]).toBe(weather);
  });
});

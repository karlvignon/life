import { describe, expect, it } from "vitest";
import { packIndex } from "../../../../core/types/grid";
import { GameOfLifeEssence } from "../essences/GameOfLifeEssence";
import { Essence, type EssenceEvolutionInput } from "../essences/Essence";
import { computeNextGeneration } from "./EvolutionEngine";

describe("EvolutionEngine", () => {
  const essence = new GameOfLifeEssence();
  const bounds = { width: 5, height: 5 };

  it("oscillates a horizontal blinker to vertical", () => {
    const living = [
      { index: packIndex(1, 2, bounds.width), essence, reproducibility: 10 },
      { index: packIndex(2, 2, bounds.width), essence, reproducibility: 10 },
      { index: packIndex(3, 2, bounds.width), essence, reproducibility: 10 },
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
    const createInputRecordingEssence = (id: string, color: number) =>
      new Essence({
        id,
        name: id,
        color,
        evolutionBehaviors: [
          {
            id: `${id}-recorder`,
            evaluate(input) {
              receivedInputs.push(input);
              return {};
            },
          },
        ],
      });

    const firstEssence = createInputRecordingEssence("first", 0x111111);
    const secondEssence = createInputRecordingEssence("second", 0x222222);

    computeNextGeneration({
      bounds,
      living: [
        {
          index: packIndex(1, 1, bounds.width),
          essence: firstEssence,
          reproducibility: 10,
        },
        {
          index: packIndex(3, 3, bounds.width),
          essence: secondEssence,
          reproducibility: 10,
        },
      ],
      currentCycle: 4,
      essenceOrder: [firstEssence, secondEssence],
    });

    expect(receivedInputs).toHaveLength(2);
    expect(receivedInputs.every((input) => !("weather" in input))).toBe(true);
  });

  it("adds the costs of every essence using the same parent in one tick", () => {
    const parentIndex = packIndex(1, 1, bounds.width);
    const secondGroupIndex = packIndex(3, 3, bounds.width);

    const createReproducingEssence = (
      id: string,
      birthIndex: number,
      reproductionCost: number,
    ) =>
      new Essence({
        id,
        name: id,
        color: 0xffffff,
        reproductionCost,
        evolutionBehaviors: [
          {
            id: `${id}-birth`,
            evaluate: () => ({
              births: [{ index: birthIndex, parentIndices: [parentIndex] }],
            }),
          },
        ],
      });

    const essenceA = createReproducingEssence(
      "reproducer-a",
      packIndex(1, 2, bounds.width),
      1,
    );
    const essenceB = createReproducingEssence(
      "reproducer-b",
      packIndex(3, 2, bounds.width),
      2,
    );

    const { reproductionCosts, newbornReproducibility } = computeNextGeneration(
      {
        bounds,
        living: [
          { index: parentIndex, essence: essenceA, reproducibility: 10 },
          {
            index: secondGroupIndex,
            essence: essenceB,
            reproducibility: 10,
          },
        ],
        currentCycle: 1,
        essenceOrder: [essenceA, essenceB],
      },
    );

    expect(reproductionCosts.get(parentIndex)).toBe(3);
    expect([...newbornReproducibility.values()]).toEqual([7, 7]);
  });

  it("blocks a birth when one parent cannot pay", () => {
    const parentIndex = packIndex(1, 1, bounds.width);
    const exhaustedParentIndex = packIndex(2, 1, bounds.width);
    const birthIndex = packIndex(1, 2, bounds.width);

    const twoParentEssence = new Essence({
      id: "two-parent",
      name: "Two parent",
      color: 0xffffff,
      evolutionBehaviors: [
        {
          id: "two-parent-birth",
          evaluate: () => ({
            births: [
              {
                index: birthIndex,
                parentIndices: [parentIndex, exhaustedParentIndex],
              },
            ],
          }),
        },
      ],
    });
    const output = computeNextGeneration({
      bounds,
      living: [
        { index: parentIndex, essence: twoParentEssence, reproducibility: 2 },
        {
          index: exhaustedParentIndex,
          essence: twoParentEssence,
          reproducibility: 0,
        },
      ],
      currentCycle: 1,
      essenceOrder: [twoParentEssence],
    });

    expect(output.nextLiving.has(birthIndex)).toBe(false);
    expect(output.reproductionCosts.size).toBe(0);
    expect(output.newbornReproducibility.size).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import { StaticEssence } from "./model/essences/StaticEssence";
import { applyModifiers, Modifier } from "./model/modifiers/Modifier";
import { Tile } from "./model/Tile";

const weather = Object.freeze({
  cycle: 1,
  season: "Spring" as const,
  windStrength: 20,
  degrees: 10,
});

describe("Modifier", () => {
  const essence = new StaticEssence();
  const author = { x: 1, y: 1, essence };

  it.each([
    ["degrees", "absolute", 3, 13],
    ["degrees", "absolute", -3, 7],
    ["windStrength", "proportional", 0.25, 25],
    ["windStrength", "proportional", -0.25, 15],
  ] as const)(
    "applies a %s %s modifier with signed value %s",
    (property, mode, value, expected) => {
      const modifier = new Modifier(author, property, mode, value);

      expect(modifier.apply(weather[property])).toBe(expected);
      expect(weather[property]).toBe(property === "degrees" ? 10 : 20);
    },
  );

  it("applies a tile's modifier array in insertion order", () => {
    const tile = new Tile(2, 1);
    tile.addModifier(new Modifier(author, "degrees", "absolute", 10));
    tile.addModifier(new Modifier(author, "degrees", "proportional", 0.5));

    expect(applyModifiers(weather, tile.getModifiers()).degrees).toBe(30);
    expect(tile.getModifiers()).toHaveLength(2);
  });

  it("rejects non-finite values", () => {
    expect(
      () => new Modifier(author, "degrees", "absolute", Number.NaN),
    ).toThrow(RangeError);
  });
});

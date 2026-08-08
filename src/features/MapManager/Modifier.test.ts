import { describe, expect, it } from "vitest";
import { StaticEssence } from "./model/essences/StaticEssence";
import { applyModifiers, Modifier } from "./model/modifiers/Modifier";
import { ModifierRegistry } from "./model/modifiers/ModifierRegistry";

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

  it("applies a target's modifiers in insertion order", () => {
    const registry = new ModifierRegistry();
    registry.add(2, 1, new Modifier(author, "degrees", "absolute", 10), 1);
    registry.add(2, 1, new Modifier(author, "degrees", "proportional", 0.5), 1);
    const modifiers = registry.getAt(2, 1);

    expect(applyModifiers(weather, modifiers).degrees).toBe(30);
    expect(modifiers).toHaveLength(2);
  });

  it("rejects non-finite values", () => {
    expect(
      () => new Modifier(author, "degrees", "absolute", Number.NaN),
    ).toThrow(RangeError);
  });
});

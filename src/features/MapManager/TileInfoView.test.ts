import { describe, expect, it } from "vitest";
import { StaticEssence } from "./model/essences/StaticEssence";
import { Modifier } from "./model/modifiers/Modifier";
import { formatModifier } from "./TileInfoView";

describe("TileInfoView modifier formatting", () => {
  const essence = new StaticEssence();
  const author = { x: 2, y: 3, essence };

  it("formats an absolute temperature decrease with its author", () => {
    const modifier = new Modifier(author, "degrees", "absolute", -2);

    expect(formatModifier(modifier)).toBe(
      "Temperature -2°C ABS · Static (2,3)",
    );
  });

  it("formats a proportional wind increase as a percentage", () => {
    const modifier = new Modifier(
      author,
      "windStrength",
      "proportional",
      0.125,
    );

    expect(formatModifier(modifier)).toBe("Wind +12.5% PROP · Static (2,3)");
  });
});

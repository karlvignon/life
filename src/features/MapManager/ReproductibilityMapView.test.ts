import { Text } from "pixi.js";
import { describe, expect, it } from "vitest";
import { formatReproductibilityScore } from "./ReproductibilityMapView";
import { ReproductibilityMapView } from "./ReproductibilityMapView";

describe("ReproductibilityMapView", () => {
  it("formats integer and decimal scores compactly", () => {
    expect(formatReproductibilityScore(10)).toBe("10");
    expect(formatReproductibilityScore(8.125)).toBe("8.13");
    expect(formatReproductibilityScore(-1.5)).toBe("-1.5");
  });

  it("synchronizes labels with the current living-cell scores", () => {
    const view = new ReproductibilityMapView(16);

    view.sync({
      livingCells: [
        { x: 1, y: 1, score: 10 },
        { x: 2, y: 1, score: 9 },
      ],
    });

    expect(view.children.filter((child) => child instanceof Text)).toHaveLength(
      2,
    );
    expect(
      view.children
        .filter((child): child is Text => child instanceof Text)
        .map((label) => label.text),
    ).toEqual(["10", "9"]);

    view.sync({ livingCells: [{ x: 1, y: 1, score: 8 }] });

    const labels = view.children.filter(
      (child): child is Text => child instanceof Text,
    );
    expect(labels).toHaveLength(1);
    expect(labels[0].text).toBe("8");

    view.destroy();
  });
});

import { describe, expect, it } from "vitest";
import { GameOptionsModel } from "./GameOptionsModel";

describe("GameOptionsModel", () => {
  it("keeps the weather values displayed with the speed controls", () => {
    const model = new GameOptionsModel();

    model.syncWeather({ windStrength: 12.5, degrees: 21 });

    expect(model.getWeather()).toEqual({
      windStrength: 12.5,
      degrees: 21,
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  DEFAULT_GAME_CONTROLS,
  GAME_COMMANDS,
  resolveGameControls,
} from "./controls";

describe("resolveGameControls", () => {
  it("uses the centralized default bindings", () => {
    expect(resolveGameControls()).toEqual(DEFAULT_GAME_CONTROLS);
  });

  it("allows a command binding to be redefined", () => {
    const controls = resolveGameControls({
      [GAME_COMMANDS.rotatePlacementClockwise]: {
        kind: "keyboard",
        code: "KeyT",
        label: "T",
      },
    });

    expect(controls[GAME_COMMANDS.rotatePlacementClockwise]).toEqual({
      kind: "keyboard",
      code: "KeyT",
      label: "T",
    });
  });

  it("rejects empty bindings", () => {
    expect(() =>
      resolveGameControls({
        [GAME_COMMANDS.rotatePlacementClockwise]: {
          kind: "keyboard",
          code: "",
          label: "R",
        },
      }),
    ).toThrow(RangeError);
  });

  it("allows the placement pointer button to be redefined", () => {
    const controls = resolveGameControls({
      [GAME_COMMANDS.placeSelectedCard]: {
        kind: "pointer",
        button: 2,
        label: "Right click",
      },
    });

    expect(controls[GAME_COMMANDS.placeSelectedCard].button).toBe(2);
  });
});

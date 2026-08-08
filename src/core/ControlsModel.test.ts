import { describe, expect, it, vi } from "vitest";
import { ControlsModel } from "./ControlsModel";
import { GAME_COMMANDS } from "./controls";

describe("ControlsModel", () => {
  it("resolves initial bindings from configuration", () => {
    const model = new ControlsModel({
      [GAME_COMMANDS.rotatePlacementClockwise]: {
        kind: "keyboard",
        code: "KeyT",
        label: "T",
      },
    });

    expect(model.getBinding(GAME_COMMANDS.rotatePlacementClockwise).code).toBe(
      "KeyT",
    );
  });

  it("updates a binding and notifies readers", () => {
    const model = new ControlsModel();
    const handler = vi.fn();
    model.onBindingChanged(handler);

    model.setBinding(GAME_COMMANDS.rotatePlacementClockwise, {
      kind: "keyboard",
      code: "KeyT",
      label: "T",
    });

    expect(model.getBinding(GAME_COMMANDS.rotatePlacementClockwise)).toEqual({
      kind: "keyboard",
      code: "KeyT",
      label: "T",
    });
    expect(handler).toHaveBeenCalledWith({
      command: GAME_COMMANDS.rotatePlacementClockwise,
      binding: {
        kind: "keyboard",
        code: "KeyT",
        label: "T",
      },
    });
  });

  it("does not notify when a binding remains unchanged", () => {
    const model = new ControlsModel();
    const handler = vi.fn();
    model.onBindingChanged(handler);

    model.setBinding(
      GAME_COMMANDS.placeSelectedCard,
      model.getBinding(GAME_COMMANDS.placeSelectedCard),
    );

    expect(handler).not.toHaveBeenCalled();
  });

  it("allows listeners to unsubscribe", () => {
    const model = new ControlsModel();
    const handler = vi.fn();
    const unsubscribe = model.onBindingChanged(handler);
    unsubscribe();

    model.setBinding(GAME_COMMANDS.placeSelectedCard, {
      kind: "pointer",
      button: 2,
      label: "Right click",
    });

    expect(handler).not.toHaveBeenCalled();
  });
});

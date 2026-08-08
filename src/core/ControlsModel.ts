import {
  resolveGameControls,
  type GameCommand,
  type GameControls,
  type GameControlsConfig,
} from "./controls";

export type ControlBindingChanged = {
  [Command in GameCommand]: {
    command: Command;
    binding: GameControls[Command];
  };
}[GameCommand];

export type ControlBindingChangedHandler = (
  change: ControlBindingChanged,
) => void;

export interface ControlsReader {
  getBinding<Command extends GameCommand>(
    command: Command,
  ): GameControls[Command];
  onBindingChanged(handler: ControlBindingChangedHandler): () => void;
}

/** État pur et observable des commandes configurées pour une partie. */
export class ControlsModel implements ControlsReader {
  private controls: GameControls;
  private readonly handlers = new Set<ControlBindingChangedHandler>();

  constructor(config: GameControlsConfig = {}) {
    this.controls = resolveGameControls(config);
  }

  getBinding<Command extends GameCommand>(
    command: Command,
  ): GameControls[Command] {
    return this.controls[command];
  }

  getSnapshot(): GameControls {
    return this.controls;
  }

  setBinding<Command extends GameCommand>(
    command: Command,
    binding: GameControls[Command],
  ): void {
    const currentBinding = this.controls[command];
    const nextControls = resolveGameControls({
      ...this.controls,
      [command]: binding,
    });
    const nextBinding = nextControls[command];

    if (bindingsAreEqual(currentBinding, nextBinding)) {
      return;
    }

    this.controls = nextControls;
    const change = { command, binding: nextBinding } as ControlBindingChanged;
    for (const handler of this.handlers) {
      handler(change);
    }
  }

  onBindingChanged(handler: ControlBindingChangedHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }
}

function bindingsAreEqual(
  left: GameControls[GameCommand],
  right: GameControls[GameCommand],
): boolean {
  if (left.kind !== right.kind || left.label !== right.label) {
    return false;
  }

  if (left.kind === "keyboard" && right.kind === "keyboard") {
    return left.code === right.code;
  }

  return (
    left.kind === "pointer" &&
    right.kind === "pointer" &&
    left.button === right.button
  );
}

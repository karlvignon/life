export const GAME_COMMANDS = {
  placeSelectedCard: "placement:place-selected-card",
  rotatePlacementClockwise: "placement:rotate-clockwise",
} as const;

export type GameCommand = (typeof GAME_COMMANDS)[keyof typeof GAME_COMMANDS];

export interface KeyboardControlBinding {
  readonly kind: "keyboard";
  readonly code: string;
  readonly label: string;
}

export interface PointerControlBinding {
  readonly kind: "pointer";
  readonly button: number;
  readonly label: string;
}

export interface GameControls {
  readonly [GAME_COMMANDS.placeSelectedCard]: PointerControlBinding;
  readonly [GAME_COMMANDS.rotatePlacementClockwise]: KeyboardControlBinding;
}

export type GameControlsConfig = {
  readonly [Command in GameCommand]?: GameControls[Command];
};

export const DEFAULT_GAME_CONTROLS: GameControls = Object.freeze({
  [GAME_COMMANDS.placeSelectedCard]: Object.freeze({
    kind: "pointer",
    button: 0,
    label: "Left click",
  }),
  [GAME_COMMANDS.rotatePlacementClockwise]: Object.freeze({
    kind: "keyboard",
    code: "KeyR",
    label: "R",
  }),
});

export function resolveGameControls(
  overrides: GameControlsConfig = {},
): GameControls {
  const placeSelectedCard =
    overrides[GAME_COMMANDS.placeSelectedCard] ??
    DEFAULT_GAME_CONTROLS[GAME_COMMANDS.placeSelectedCard];
  const rotatePlacementClockwise =
    overrides[GAME_COMMANDS.rotatePlacementClockwise] ??
    DEFAULT_GAME_CONTROLS[GAME_COMMANDS.rotatePlacementClockwise];

  if (
    !Number.isSafeInteger(placeSelectedCard.button) ||
    placeSelectedCard.button < 0 ||
    !placeSelectedCard.label.trim()
  ) {
    throw new RangeError(
      `Control binding for ${GAME_COMMANDS.placeSelectedCard} is invalid`,
    );
  }

  if (
    !rotatePlacementClockwise.code.trim() ||
    !rotatePlacementClockwise.label.trim()
  ) {
    throw new RangeError(
      `Control binding for ${GAME_COMMANDS.rotatePlacementClockwise} cannot be empty`,
    );
  }

  return Object.freeze({
    [GAME_COMMANDS.placeSelectedCard]: Object.freeze({ ...placeSelectedCard }),
    [GAME_COMMANDS.rotatePlacementClockwise]: Object.freeze({
      ...rotatePlacementClockwise,
    }),
  });
}

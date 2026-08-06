import {
  Container,
  FederatedPointerEvent,
  Graphics,
  Rectangle,
  Text,
} from "pixi.js";
import type { PlayerId } from "../../core/types/player";
import type { PlayerEventManager } from "./PlayerEventManager";
import type { ParentLayoutBounds, PlayerSelectionOption } from "./types";

const PANEL_PADDING = 10;
const PANEL_MARGIN = 12;
const PANEL_GAP = 8;
const PANEL_BACKGROUND = 0x111827;
const PANEL_BORDER = 0x374151;
const BUTTON_BACKGROUND = 0x1f2937;
const BUTTON_ACTIVE_BACKGROUND = 0x273548;
const TEXT_COLOR = 0xf9fafb;
const SECONDARY_TEXT_COLOR = 0x9ca3af;
const BUTTON_WIDTH = 132;
const BUTTON_HEIGHT = 42;

class PlayerButtonView extends Container {
  private readonly background = new Graphics();
  private active = false;

  constructor(
    private readonly option: PlayerSelectionOption,
    private readonly eventManager: PlayerEventManager,
  ) {
    super();

    const teamIndicator = new Graphics()
      .roundRect(0, 0, 5, BUTTON_HEIGHT, 2)
      .fill(option.teamColor);
    const label = new Text({
      text: option.label,
      style: {
        fill: TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: 12,
        fontWeight: "bold",
      },
    });
    const team = new Text({
      text: option.teamLabel,
      style: {
        fill: SECONDARY_TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: 10,
      },
    });

    label.position.set(13, 5);
    team.position.set(13, 23);
    this.addChild(this.background, teamIndicator, label, team);
    this.eventMode = "static";
    this.cursor = "pointer";
    this.hitArea = new Rectangle(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT);
    this.on("pointerdown", this.onPointerDown);
    this.redraw();
  }

  getPlayerId(): PlayerId {
    return this.option.id;
  }

  setActive(active: boolean): void {
    if (this.active === active) {
      return;
    }
    this.active = active;
    this.redraw();
  }

  destroy(): void {
    this.off("pointerdown", this.onPointerDown);
    super.destroy({ children: true });
  }

  private readonly onPointerDown = (event: FederatedPointerEvent): void => {
    event.stopPropagation();
    this.eventManager.emit("player:select", { playerId: this.option.id });
  };

  private redraw(): void {
    this.background.clear();
    this.background
      .roundRect(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT, 5)
      .fill(this.active ? BUTTON_ACTIVE_BACKGROUND : BUTTON_BACKGROUND)
      .stroke({
        width: this.active ? 2 : 1,
        color: this.active ? this.option.teamColor : PANEL_BORDER,
      });
  }
}

export class PlayerSelectorView extends Container {
  private readonly buttons: ReadonlyArray<PlayerButtonView>;

  constructor(
    options: ReadonlyArray<PlayerSelectionOption>,
    eventManager: PlayerEventManager,
  ) {
    super();

    const background = new Graphics();
    const title = new Text({
      text: "Placement author",
      style: {
        fill: TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: 12,
        fontWeight: "bold",
      },
    });
    title.position.set(PANEL_PADDING, PANEL_PADDING);

    this.buttons = options.map(
      (option) => new PlayerButtonView(option, eventManager),
    );
    let x = PANEL_PADDING;
    const buttonY = PANEL_PADDING + title.height + PANEL_GAP;
    for (const button of this.buttons) {
      button.position.set(x, buttonY);
      x += BUTTON_WIDTH + PANEL_GAP;
    }

    const panelWidth =
      PANEL_PADDING * 2 +
      this.buttons.length * BUTTON_WIDTH +
      Math.max(0, this.buttons.length - 1) * PANEL_GAP;
    const panelHeight = buttonY + BUTTON_HEIGHT + PANEL_PADDING;
    background
      .roundRect(0, 0, panelWidth, panelHeight, 6)
      .fill(PANEL_BACKGROUND)
      .stroke({ width: 1, color: PANEL_BORDER });
    this.addChild(background, title, ...this.buttons);
  }

  syncSelectedPlayer(playerId: PlayerId): void {
    for (const button of this.buttons) {
      button.setActive(button.getPlayerId() === playerId);
    }
  }

  layoutWithinParent(bounds: ParentLayoutBounds): void {
    const availableWidth = Math.max(1, bounds.width - PANEL_MARGIN * 2);
    const localWidth = this.getLocalBounds().width;
    const scale = Math.min(1, availableWidth / localWidth);
    this.scale.set(scale);
    this.position.set((bounds.width - localWidth * scale) / 2, PANEL_MARGIN);
  }

  destroy(): void {
    super.destroy({ children: true });
  }
}

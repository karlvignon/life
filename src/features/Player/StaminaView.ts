import { Container, Graphics, Text } from "pixi.js";
import type { Player } from "./Player";
import type { ParentLayoutBounds } from "./types";

const PANEL_PADDING = 10;
const PANEL_MARGIN = 16;
const PANEL_BACKGROUND = 0x111827;
const PANEL_BORDER = 0x374151;
const TRACK_COLOR = 0x374151;
const FILL_COLOR = 0xfacc15;
const TEXT_COLOR = 0xf9fafb;
const TRACK_WIDTH = 28;
const TRACK_HEIGHT = 160;

/** Représentation verticale de la stamina, remplie du bas vers le haut. */
export class StaminaView extends Container {
  private readonly background = new Graphics();
  private readonly track = new Graphics();
  private readonly fill = new Graphics();
  private readonly title = new Text({
    text: "Stamina",
    style: {
      fill: FILL_COLOR,
      fontFamily: "monospace",
      fontSize: 13,
      fontWeight: "bold",
    },
  });
  private readonly value = new Text({
    text: "",
    style: { fill: TEXT_COLOR, fontFamily: "monospace", fontSize: 12 },
  });
  private parentBounds: ParentLayoutBounds = { width: 0, height: 0 };

  constructor() {
    super();
    this.eventMode = "static";
    this.addChild(
      this.background,
      this.track,
      this.fill,
      this.title,
      this.value,
    );
  }

  syncFromModel(player: Player): void {
    const stamina = player.getStaminaSnapshot();
    const normalized = Math.min(
      1,
      Math.max(0, stamina.current / stamina.maximum),
    );
    const fillHeight = TRACK_HEIGHT * normalized;

    this.value.text = `${formatStamina(stamina.current)} / ${formatStamina(
      stamina.maximum,
    )}`;
    const contentWidth = Math.max(
      this.title.width,
      this.value.width,
      TRACK_WIDTH,
    );
    const trackX = PANEL_PADDING + (contentWidth - TRACK_WIDTH) / 2;
    const trackY = PANEL_PADDING + this.title.height + 8;

    this.title.position.set(
      PANEL_PADDING + (contentWidth - this.title.width) / 2,
      PANEL_PADDING,
    );
    this.track.clear();
    this.track
      .roundRect(trackX, trackY, TRACK_WIDTH, TRACK_HEIGHT, 4)
      .fill(TRACK_COLOR);
    this.fill.clear();
    if (fillHeight > 0) {
      this.fill
        .roundRect(
          trackX,
          trackY + TRACK_HEIGHT - fillHeight,
          TRACK_WIDTH,
          fillHeight,
          Math.min(4, fillHeight / 2),
        )
        .fill(FILL_COLOR);
    }

    this.value.position.set(
      PANEL_PADDING + (contentWidth - this.value.width) / 2,
      trackY + TRACK_HEIGHT + 8,
    );

    const panelWidth = contentWidth + PANEL_PADDING * 2;
    const panelHeight = this.value.y + this.value.height + PANEL_PADDING;
    this.background.clear();
    this.background
      .roundRect(0, 0, panelWidth, panelHeight, 6)
      .fill(PANEL_BACKGROUND)
      .stroke({ width: 1, color: PANEL_BORDER });

    this.layoutWithinParent(this.parentBounds);
  }

  layoutWithinParent(bounds: ParentLayoutBounds): void {
    this.parentBounds = bounds;
    this.position.set(
      Math.max(PANEL_MARGIN, bounds.width - this.width - PANEL_MARGIN),
      Math.max(PANEL_MARGIN, (bounds.height - this.height) / 2),
    );
  }

  destroy(): void {
    super.destroy({ children: true });
  }
}

function formatStamina(value: number): string {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}

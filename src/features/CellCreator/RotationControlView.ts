import {
  Container,
  FederatedPointerEvent,
  Graphics,
  Rectangle,
  Text,
} from "pixi.js";
import type { PlaceableRotation } from "../MapManager/main";
import { GAME_COMMANDS } from "../../core/controls";
import type { CellCreatorEventManager } from "./CellCreatorEventManager";

const BUTTON_PADDING = 8;
const BUTTON_BACKGROUND = 0x111827;
const BUTTON_BACKGROUND_HOVER = 0x1f2937;
const BUTTON_BORDER = 0x60a5fa;
const TEXT_COLOR = 0xbfdbfe;
const DISABLED_OPACITY = 0.45;

export class RotationControlView extends Container {
  private readonly background = new Graphics();
  private readonly labelText: Text;
  private buttonWidth = 0;
  private buttonHeight = 0;
  private shortcutLabel: string;
  private placementRotation: PlaceableRotation = 0;
  private enabled = false;
  private hovered = false;

  constructor(
    private readonly eventManager: CellCreatorEventManager,
    shortcutLabel: string,
  ) {
    super();

    this.labelText = new Text({
      text: `Rotate 270° [${shortcutLabel}]`,
      style: {
        fill: TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: 12,
        fontWeight: "bold",
      },
    });

    this.shortcutLabel = shortcutLabel;
    this.labelText.position.set(BUTTON_PADDING, BUTTON_PADDING);

    this.addChild(this.background, this.labelText);
    this.on("pointerdown", this.onPointerDown);
    this.on("pointerover", this.onPointerOver);
    this.on("pointerout", this.onPointerOut);
    this.updateLabelAndBounds();
    this.redraw();
  }

  get width(): number {
    return this.buttonWidth;
  }

  get height(): number {
    return this.buttonHeight;
  }

  setState(rotation: PlaceableRotation, enabled: boolean): void {
    this.placementRotation = rotation;
    this.updateLabelAndBounds();
    this.enabled = enabled;
    if (!enabled) {
      this.hovered = false;
    }
    this.eventMode = enabled ? "static" : "none";
    this.cursor = enabled ? "pointer" : "default";
    this.alpha = enabled ? 1 : DISABLED_OPACITY;
    this.redraw();
  }

  setShortcutLabel(shortcutLabel: string): void {
    this.shortcutLabel = shortcutLabel;
    this.updateLabelAndBounds();
    this.redraw();
  }

  destroy(): void {
    this.off("pointerdown", this.onPointerDown);
    this.off("pointerover", this.onPointerOver);
    this.off("pointerout", this.onPointerOut);
    super.destroy({ children: true });
  }

  private readonly onPointerDown = (event: FederatedPointerEvent): void => {
    event.stopPropagation();
    if (this.enabled) {
      this.eventManager.emit(GAME_COMMANDS.rotatePlacementClockwise, undefined);
    }
  };

  private readonly onPointerOver = (): void => {
    this.hovered = true;
    this.redraw();
  };

  private readonly onPointerOut = (): void => {
    this.hovered = false;
    this.redraw();
  };

  private redraw(): void {
    this.background.clear();
    this.background
      .roundRect(0, 0, this.buttonWidth, this.buttonHeight, 6)
      .fill(
        this.hovered && this.enabled
          ? BUTTON_BACKGROUND_HOVER
          : BUTTON_BACKGROUND,
      )
      .stroke({ width: 1, color: BUTTON_BORDER });
  }

  private updateLabelAndBounds(): void {
    this.labelText.text = `Rotate 270° [${this.shortcutLabel}]`;
    this.buttonWidth = this.labelText.width + BUTTON_PADDING * 2;
    this.buttonHeight = this.labelText.height + BUTTON_PADDING * 2;
    this.labelText.text = `Rotate ${this.placementRotation}° [${this.shortcutLabel}]`;
    this.hitArea = new Rectangle(0, 0, this.buttonWidth, this.buttonHeight);
  }
}

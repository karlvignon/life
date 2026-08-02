import {
  Container,
  FederatedPointerEvent,
  Graphics,
  Rectangle,
  Text,
} from "pixi.js";
import { CellCreatorEventManager } from "./CellCreatorEventManager";

const BUTTON_PADDING = 8;
const BUTTON_BACKGROUND = 0x1f1111;
const BUTTON_BORDER = 0xef4444;
const BUTTON_BACKGROUND_HOVER = 0x2a1515;
const TEXT_COLOR = 0xfca5a5;

export class ClearUiButton extends Container {
  private readonly eventManager: CellCreatorEventManager;
  private readonly background: Graphics;
  private readonly buttonWidth: number;
  private readonly buttonHeight: number;

  constructor(eventManager: CellCreatorEventManager) {
    super();

    this.eventManager = eventManager;
    this.background = new Graphics();

    const labelText = new Text({
      text: "Clear",
      style: {
        fill: TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: 12,
        fontWeight: "bold",
      },
    });

    labelText.position.set(BUTTON_PADDING, BUTTON_PADDING);
    this.buttonWidth = labelText.width + BUTTON_PADDING * 2;
    this.buttonHeight = labelText.height + BUTTON_PADDING * 2;

    this.background
      .roundRect(0, 0, this.buttonWidth, this.buttonHeight, 6)
      .fill(BUTTON_BACKGROUND)
      .stroke({ width: 1, color: BUTTON_BORDER });

    this.addChild(this.background, labelText);

    this.eventMode = "static";
    this.cursor = "pointer";
    this.hitArea = new Rectangle(0, 0, this.buttonWidth, this.buttonHeight);

    this.on("pointerdown", this.onPointerDown);
    this.on("pointerover", this.onPointerOver);
    this.on("pointerout", this.onPointerOut);
  }

  get width(): number {
    return this.buttonWidth;
  }

  get height(): number {
    return this.buttonHeight;
  }

  destroy(): void {
    this.off("pointerdown", this.onPointerDown);
    this.off("pointerover", this.onPointerOver);
    this.off("pointerout", this.onPointerOut);
    super.destroy({ children: true });
  }

  private readonly onPointerDown = (event: FederatedPointerEvent): void => {
    event.stopPropagation();
    this.eventManager.emit("map:clear", undefined);
  };

  private readonly onPointerOver = (): void => {
    this.background.clear();
    this.background
      .roundRect(0, 0, this.buttonWidth, this.buttonHeight, 6)
      .fill(BUTTON_BACKGROUND_HOVER)
      .stroke({ width: 1, color: BUTTON_BORDER });
  };

  private readonly onPointerOut = (): void => {
    this.background.clear();
    this.background
      .roundRect(0, 0, this.buttonWidth, this.buttonHeight, 6)
      .fill(BUTTON_BACKGROUND)
      .stroke({ width: 1, color: BUTTON_BORDER });
  };
}

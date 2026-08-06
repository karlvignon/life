import {
  Container,
  FederatedPointerEvent,
  Graphics,
  Rectangle,
  Text,
} from "pixi.js";
import type { Card } from "./Card";
import type { CellCreatorEventManager } from "./CellCreatorEventManager";
import type { CardId, EssenceFamilyId } from "./types";

const BUTTON_PADDING = 8;
const BUTTON_BACKGROUND = 0x111827;
const BUTTON_BORDER = 0x374151;
const BUTTON_BACKGROUND_ACTIVE = 0x1f2937;
const BUTTON_BORDER_ACTIVE = 0x00ff88;
const TEXT_COLOR = 0xf9fafb;
const PREVIEW_CELL_SIZE = 3;
const PREVIEW_CELL_GAP = 1;

export class CardView extends Container {
  private readonly card: Card;
  private readonly eventManager: CellCreatorEventManager;
  private readonly background: Graphics;
  private readonly buttonWidth: number;
  private readonly buttonHeight: number;
  private active = false;

  constructor(eventManager: CellCreatorEventManager, card: Card) {
    super();

    this.eventManager = eventManager;
    this.card = card;
    this.background = new Graphics();

    const labelText = new Text({
      text: `${card.label}\nSTA ${card.staminaCost}`,
      style: {
        fill: TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: 12,
      },
    });

    const preview = this.createMiniPreview();
    preview.position.set(BUTTON_PADDING, BUTTON_PADDING);
    labelText.position.set(BUTTON_PADDING, BUTTON_PADDING + preview.height + 4);

    this.buttonWidth =
      Math.max(preview.width, labelText.width) + BUTTON_PADDING * 2;
    this.buttonHeight =
      preview.height + labelText.height + BUTTON_PADDING * 2 + 4;

    this.addChild(this.background, preview, labelText);
    this.redrawBackground();

    this.eventMode = "static";
    this.cursor = "pointer";
    this.hitArea = new Rectangle(0, 0, this.buttonWidth, this.buttonHeight);
    this.on("pointerdown", this.onPointerDown);
  }

  getCardId(): CardId {
    return this.card.id;
  }

  getEssenceId(): EssenceFamilyId {
    return this.card.familyId;
  }

  get width(): number {
    return this.buttonWidth;
  }

  get height(): number {
    return this.buttonHeight;
  }

  setActive(active: boolean): void {
    if (this.active === active) {
      return;
    }

    this.active = active;
    this.redrawBackground();
  }

  setAvailable(available: boolean): void {
    this.visible = available;
    this.eventMode = available ? "static" : "none";
  }

  destroy(): void {
    this.off("pointerdown", this.onPointerDown);
    super.destroy({ children: true });
  }

  private readonly onPointerDown = (event: FederatedPointerEvent): void => {
    event.stopPropagation();
    this.eventManager.emit("card:select", { cardId: this.card.id });
  };

  private createMiniPreview(): Container {
    const preview = new Container();

    for (const cell of this.card.pattern.getCells()) {
      const graphic = new Graphics()
        .rect(0, 0, PREVIEW_CELL_SIZE, PREVIEW_CELL_SIZE)
        .fill(this.card.essence.color);
      graphic.position.set(
        cell.x * (PREVIEW_CELL_SIZE + PREVIEW_CELL_GAP),
        cell.y * (PREVIEW_CELL_SIZE + PREVIEW_CELL_GAP),
      );
      preview.addChild(graphic);
    }

    return preview;
  }

  private redrawBackground(): void {
    this.background.clear();
    this.background
      .roundRect(0, 0, this.buttonWidth, this.buttonHeight, 6)
      .fill(this.active ? BUTTON_BACKGROUND_ACTIVE : BUTTON_BACKGROUND)
      .stroke({
        width: 1,
        color: this.active ? BUTTON_BORDER_ACTIVE : BUTTON_BORDER,
      });
  }
}

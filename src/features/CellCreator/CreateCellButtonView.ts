import {
  Container,
  FederatedPointerEvent,
  Graphics,
  Rectangle,
  Text,
} from "pixi.js";
import type { Essence } from "../MapManager/main";
import { CellCreatorEventManager } from "./CellCreatorEventManager";
import type { PatternDefinition, PatternId } from "./types";

const BUTTON_PADDING = 8;
const BUTTON_BACKGROUND = 0x111827;
const BUTTON_BORDER = 0x374151;
const BUTTON_BACKGROUND_ACTIVE = 0x1f2937;
const BUTTON_BORDER_ACTIVE = 0x00ff88;
const TEXT_COLOR = 0xf9fafb;
const PREVIEW_CELL_SIZE = 3;
const PREVIEW_CELL_GAP = 1;

export class CreateCellButtonView extends Container {
  private readonly definition: PatternDefinition;
  private readonly eventManager: CellCreatorEventManager;
  private readonly background: Graphics;
  private readonly previewCells: Graphics[] = [];
  private readonly buttonWidth: number;
  private readonly buttonHeight: number;
  private active = false;

  constructor(
    eventManager: CellCreatorEventManager,
    definition: PatternDefinition,
    essence: Essence,
  ) {
    super();

    this.eventManager = eventManager;
    this.definition = definition;

    this.background = new Graphics();
    const labelText = new Text({
      text: definition.label,
      style: {
        fill: TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: 12,
      },
    });

    const preview = this.createMiniPreview(essence);
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

  getPatternId(): PatternId {
    return this.definition.id;
  }

  syncEssence(essence: Essence): void {
    for (const graphic of this.previewCells) {
      graphic.clear();
      graphic
        .rect(0, 0, PREVIEW_CELL_SIZE, PREVIEW_CELL_SIZE)
        .fill(essence.color);
    }
  }

  get width(): number {
    return this.buttonWidth;
  }

  get height(): number {
    return this.buttonHeight;
  }

  setActive(active: boolean): void {
    this.active = active;
    this.redrawBackground();
  }

  destroy(): void {
    this.off("pointerdown", this.onPointerDown);
    super.destroy({ children: true });
  }

  private readonly onPointerDown = (event: FederatedPointerEvent): void => {
    event.stopPropagation();
    this.eventManager.emit("pattern:select", {
      patternId: this.definition.id,
    });
  };

  private createMiniPreview(essence: Essence): Container {
    const preview = new Container();
    const cells = this.definition.createPattern(essence).getCells();

    for (const cell of cells) {
      const graphic = new Graphics();
      graphic
        .rect(0, 0, PREVIEW_CELL_SIZE, PREVIEW_CELL_SIZE)
        .fill(essence.color);
      graphic.position.set(
        cell.x * (PREVIEW_CELL_SIZE + PREVIEW_CELL_GAP),
        cell.y * (PREVIEW_CELL_SIZE + PREVIEW_CELL_GAP),
      );
      this.previewCells.push(graphic);
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

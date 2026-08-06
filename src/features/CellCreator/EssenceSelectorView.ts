import {
  Container,
  FederatedPointerEvent,
  Graphics,
  Rectangle,
  Text,
} from "pixi.js";
import type { CellCreatorEventManager } from "./CellCreatorEventManager";
import type {
  EssenceDefinition,
  EssenceFamilyId,
  ParentLayoutBounds,
} from "./types";

const PANEL_PADDING = 12;
const PANEL_MARGIN = 12;
const PANEL_GAP = 8;
const BUTTON_COLUMNS = 2;
const TOP_LEFT_UI_RESERVED_HEIGHT = 380;
const BOTTOM_LEFT_UI_RESERVED_HEIGHT = 110;
const PANEL_BACKGROUND = 0x111827;
const PANEL_BORDER = 0x374151;
const TEXT_COLOR = 0xf9fafb;

const BUTTON_WIDTH = 152;
const BUTTON_HEIGHT = 32;
const BUTTON_PADDING = 8;
const BUTTON_BACKGROUND = 0x1f2937;
const BUTTON_BACKGROUND_ACTIVE = 0x273548;
const BUTTON_BORDER = 0x374151;
const SWATCH_SIZE = 12;

class EssenceButtonView extends Container {
  private readonly definition: EssenceDefinition;
  private readonly eventManager: CellCreatorEventManager;
  private readonly background = new Graphics();
  private active = false;

  constructor(
    definition: EssenceDefinition,
    eventManager: CellCreatorEventManager,
  ) {
    super();

    this.definition = definition;
    this.eventManager = eventManager;

    const swatch = new Graphics()
      .roundRect(0, 0, SWATCH_SIZE, SWATCH_SIZE, 3)
      .fill(definition.essence.color);
    swatch.position.set(BUTTON_PADDING, (BUTTON_HEIGHT - SWATCH_SIZE) / 2);

    const label = new Text({
      text: definition.label,
      style: {
        fill: TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: 12,
      },
    });
    label.position.set(
      BUTTON_PADDING + SWATCH_SIZE + 8,
      (BUTTON_HEIGHT - label.height) / 2,
    );

    this.addChild(this.background, swatch, label);
    this.redraw();

    this.eventMode = "static";
    this.cursor = "pointer";
    this.hitArea = new Rectangle(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT);
    this.on("pointerdown", this.onPointerDown);
  }

  getEssenceId(): EssenceFamilyId {
    return this.definition.id;
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
    this.eventManager.emit("essence:select", {
      essenceId: this.definition.id,
    });
  };

  private redraw(): void {
    this.background.clear();
    this.background
      .roundRect(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT, 6)
      .fill(this.active ? BUTTON_BACKGROUND_ACTIVE : BUTTON_BACKGROUND)
      .stroke({
        width: this.active ? 2 : 1,
        color: this.active ? this.definition.essence.color : BUTTON_BORDER,
      });
  }
}

export class EssenceSelectorView extends Container {
  private readonly background = new Graphics();
  private readonly buttons: EssenceButtonView[];

  constructor(
    definitions: ReadonlyArray<EssenceDefinition>,
    eventManager: CellCreatorEventManager,
  ) {
    super();

    const title = new Text({
      text: "Essence",
      style: {
        fill: TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: 14,
        fontWeight: "bold",
      },
    });
    title.position.set(PANEL_PADDING, PANEL_PADDING);

    this.buttons = definitions.map(
      (definition) => new EssenceButtonView(definition, eventManager),
    );

    const buttonsY = PANEL_PADDING + title.height + PANEL_GAP;
    for (const [index, button] of this.buttons.entries()) {
      const column = index % BUTTON_COLUMNS;
      const row = Math.floor(index / BUTTON_COLUMNS);
      button.position.set(
        PANEL_PADDING + column * (BUTTON_WIDTH + PANEL_GAP),
        buttonsY + row * (BUTTON_HEIGHT + PANEL_GAP),
      );
    }

    const columnCount = Math.min(BUTTON_COLUMNS, this.buttons.length);
    const rowCount = Math.ceil(this.buttons.length / BUTTON_COLUMNS);
    const panelWidth =
      PANEL_PADDING * 2 +
      columnCount * BUTTON_WIDTH +
      Math.max(0, columnCount - 1) * PANEL_GAP;
    const panelHeight =
      buttonsY +
      rowCount * BUTTON_HEIGHT +
      Math.max(0, rowCount - 1) * PANEL_GAP +
      PANEL_PADDING;
    this.background
      .roundRect(0, 0, panelWidth, panelHeight, 6)
      .fill(PANEL_BACKGROUND)
      .stroke({ width: 1, color: PANEL_BORDER });

    this.addChild(this.background, title, ...this.buttons);
  }

  syncSelectedEssence(selectedId: EssenceFamilyId): void {
    for (const button of this.buttons) {
      button.setActive(button.getEssenceId() === selectedId);
    }
  }

  layoutWithinParent(bounds: ParentLayoutBounds): void {
    const localBounds = this.getLocalBounds();
    const availableWidth = Math.max(1, bounds.width - PANEL_MARGIN * 2);
    const availableHeight = Math.max(
      1,
      bounds.height -
        TOP_LEFT_UI_RESERVED_HEIGHT -
        BOTTOM_LEFT_UI_RESERVED_HEIGHT,
    );
    const scale = Math.min(
      1,
      availableWidth / localBounds.width,
      availableHeight / localBounds.height,
    );
    this.scale.set(scale);
    this.position.set(
      PANEL_MARGIN,
      TOP_LEFT_UI_RESERVED_HEIGHT +
        (availableHeight - localBounds.height * scale) / 2,
    );
  }

  destroy(): void {
    super.destroy({ children: true });
  }
}

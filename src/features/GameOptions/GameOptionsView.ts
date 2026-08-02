import { Container, FederatedPointerEvent, Graphics, Text } from "pixi.js";
import { GameOptionsEventManager } from "./GameOptionsEventManager";
import { GameOptionsModel } from "./GameOptionsModel";
import type {
  GameOptionsUiLayoutConfig,
  HorizontalAlign,
  ParentLayoutBounds,
  VerticalAlign,
} from "./types";
import { DEFAULT_GAME_OPTIONS_UI_LAYOUT } from "./types";

const PANEL_PADDING = 12;
const PANEL_BACKGROUND = 0x111827;
const PANEL_BORDER = 0x374151;
const TEXT_COLOR = 0xf9fafb;
const TRACK_COLOR = 0x374151;
const TRACK_FILL_COLOR = 0x00ff88;
const THUMB_COLOR = 0xf9fafb;

const TRACK_WIDTH = 160;
const TRACK_HEIGHT = 6;
const THUMB_RADIUS = 8;
const SLIDER_HIT_HEIGHT = 24;

export class GameOptionsView extends Container {
  private readonly layoutConfig: GameOptionsUiLayoutConfig;
  private readonly eventManager: GameOptionsEventManager;
  private readonly background: Graphics;
  private readonly labelText: Text;
  private readonly valueText: Text;
  private readonly sliderArea: Container;
  private readonly trackBackground: Graphics;
  private readonly trackFill: Graphics;
  private readonly thumb: Graphics;

  private model: GameOptionsModel | null = null;
  private parentBounds: ParentLayoutBounds = { width: 0, height: 0 };
  private dragging = false;

  constructor(
    eventManager: GameOptionsEventManager,
    layoutConfig: GameOptionsUiLayoutConfig = DEFAULT_GAME_OPTIONS_UI_LAYOUT,
  ) {
    super();

    this.eventManager = eventManager;
    this.layoutConfig = {
      ...DEFAULT_GAME_OPTIONS_UI_LAYOUT,
      ...layoutConfig,
      margin: {
        x:
          layoutConfig.margin?.x ??
          DEFAULT_GAME_OPTIONS_UI_LAYOUT.margin?.x ??
          0,
        y:
          layoutConfig.margin?.y ??
          DEFAULT_GAME_OPTIONS_UI_LAYOUT.margin?.y ??
          0,
      },
    };

    this.background = new Graphics();
    this.labelText = new Text({
      text: "Speed",
      style: {
        fill: TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: 14,
      },
    });
    this.valueText = new Text({
      text: "",
      style: {
        fill: TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: 14,
      },
    });

    this.sliderArea = new Container();
    this.trackBackground = new Graphics();
    this.trackFill = new Graphics();
    this.thumb = new Graphics();

    this.sliderArea.addChild(this.trackBackground, this.trackFill, this.thumb);
    this.addChild(
      this.background,
      this.labelText,
      this.sliderArea,
      this.valueText,
    );

    this.bindSliderEvents();
  }

  syncFromModel(model: GameOptionsModel): void {
    this.model = model;
    this.updateSliderVisuals(model.getNormalizedSpeed());
    this.valueText.text = formatSpeed(model.getSpeed());
    this.layoutWithinParent(this.parentBounds);
  }

  layoutWithinParent(bounds: ParentLayoutBounds): void {
    this.parentBounds = bounds;

    const labelHeight = this.labelText.height;
    const sliderY = PANEL_PADDING + labelHeight + 8;
    const valueY = sliderY + SLIDER_HIT_HEIGHT + 4;

    this.labelText.position.set(PANEL_PADDING, PANEL_PADDING);
    this.sliderArea.position.set(PANEL_PADDING, sliderY);
    this.valueText.position.set(PANEL_PADDING, valueY);

    const panelWidth = PANEL_PADDING * 2 + TRACK_WIDTH;
    const panelHeight = valueY + this.valueText.height + PANEL_PADDING;

    this.background.clear();
    this.background
      .roundRect(0, 0, panelWidth, panelHeight, 6)
      .fill(PANEL_BACKGROUND)
      .stroke({ width: 1, color: PANEL_BORDER });

    const margin = this.layoutConfig.margin ?? { x: 0, y: 0 };
    const anchorX = bounds.width * this.layoutConfig.anchor.x;
    const anchorY = bounds.height * this.layoutConfig.anchor.y;

    this.position.set(
      resolveHorizontalPosition(
        anchorX,
        panelWidth,
        this.layoutConfig.horizontalAlign,
        margin.x,
      ),
      resolveVerticalPosition(
        anchorY,
        panelHeight,
        this.layoutConfig.verticalAlign,
        margin.y,
      ),
    );

    if (this.model) {
      this.updateSliderVisuals(this.model.getNormalizedSpeed());
    }
  }

  destroy(): void {
    this.unbindSliderEvents();
    super.destroy({ children: true });
  }

  private bindSliderEvents(): void {
    this.sliderArea.eventMode = "static";
    this.sliderArea.cursor = "pointer";
    this.sliderArea.hitArea = {
      contains: (x: number, y: number) =>
        x >= 0 && x <= TRACK_WIDTH && y >= 0 && y <= SLIDER_HIT_HEIGHT,
    };

    this.sliderArea.on("pointerdown", this.onPointerDown);
    this.sliderArea.on("pointermove", this.onPointerMove);
    this.sliderArea.on("pointerup", this.onPointerUp);
    this.sliderArea.on("pointerupoutside", this.onPointerUp);
  }

  private unbindSliderEvents(): void {
    this.sliderArea.off("pointerdown", this.onPointerDown);
    this.sliderArea.off("pointermove", this.onPointerMove);
    this.sliderArea.off("pointerup", this.onPointerUp);
    this.sliderArea.off("pointerupoutside", this.onPointerUp);
  }

  private readonly onPointerDown = (event: FederatedPointerEvent): void => {
    this.dragging = true;
    this.updateSpeedFromPointer(event);
  };

  private readonly onPointerMove = (event: FederatedPointerEvent): void => {
    if (!this.dragging) {
      return;
    }

    this.updateSpeedFromPointer(event);
  };

  private readonly onPointerUp = (): void => {
    this.dragging = false;
  };

  private updateSpeedFromPointer(event: FederatedPointerEvent): void {
    if (!this.model) {
      return;
    }

    const localX = event.getLocalPosition(this.sliderArea).x;
    const normalized = localX / TRACK_WIDTH;
    const speed =
      this.model.getMinSpeed() +
      Math.min(1, Math.max(0, normalized)) *
        (this.model.getMaxSpeed() - this.model.getMinSpeed());

    this.eventManager.emit("speed:change", { speed });
  }

  private updateSliderVisuals(normalized: number): void {
    const clamped = Math.min(1, Math.max(0, normalized));
    const fillWidth = TRACK_WIDTH * clamped;
    const thumbX = fillWidth;
    const trackY = (SLIDER_HIT_HEIGHT - TRACK_HEIGHT) / 2;

    this.trackBackground.clear();
    this.trackBackground
      .roundRect(0, trackY, TRACK_WIDTH, TRACK_HEIGHT, TRACK_HEIGHT / 2)
      .fill(TRACK_COLOR);

    this.trackFill.clear();
    if (fillWidth > 0) {
      this.trackFill
        .roundRect(0, trackY, fillWidth, TRACK_HEIGHT, TRACK_HEIGHT / 2)
        .fill(TRACK_FILL_COLOR);
    }

    this.thumb.clear();
    this.thumb
      .circle(thumbX, SLIDER_HIT_HEIGHT / 2, THUMB_RADIUS)
      .fill(THUMB_COLOR);
  }
}

function formatSpeed(speed: number): string {
  if (speed <= 0) {
    return "Paused";
  }

  return `${speed.toFixed(1)} gen/s`;
}

function resolveHorizontalPosition(
  anchorX: number,
  panelWidth: number,
  align: HorizontalAlign,
  marginX: number,
): number {
  switch (align) {
    case "start":
      return anchorX + marginX;
    case "center":
      return anchorX - panelWidth / 2 + marginX;
    case "end":
      return anchorX - panelWidth - marginX;
  }
}

function resolveVerticalPosition(
  anchorY: number,
  panelHeight: number,
  align: VerticalAlign,
  marginY: number,
): number {
  switch (align) {
    case "start":
      return anchorY + marginY;
    case "center":
      return anchorY - panelHeight / 2 + marginY;
    case "end":
      return anchorY - panelHeight - marginY;
  }
}

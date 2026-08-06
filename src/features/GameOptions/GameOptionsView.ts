import { Container, Graphics, Text } from "pixi.js";
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
const TITLE_COLOR = 0x00ff88;
const PANEL_WIDTH = 184;

export class GameOptionsView extends Container {
  private readonly layoutConfig: GameOptionsUiLayoutConfig;
  private readonly background = new Graphics();
  private readonly weatherTitle = new Text({
    text: "Weather",
    style: {
      fill: TITLE_COLOR,
      fontFamily: "monospace",
      fontSize: 14,
    },
  });
  private readonly weatherValues = new Text({
    text: "",
    style: {
      fill: TEXT_COLOR,
      fontFamily: "monospace",
      fontSize: 13,
    },
  });
  private parentBounds: ParentLayoutBounds = { width: 0, height: 0 };

  constructor(
    layoutConfig: GameOptionsUiLayoutConfig = DEFAULT_GAME_OPTIONS_UI_LAYOUT,
  ) {
    super();

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

    this.addChild(this.background, this.weatherTitle, this.weatherValues);
  }

  syncFromModel(model: GameOptionsModel): void {
    const weather = model.getWeather();
    this.weatherValues.text = [
      `Wind: ${weather.windStrength.toFixed(1)}`,
      `Temperature: ${weather.degrees.toFixed(1)} °C`,
    ].join("\n");
    this.layoutWithinParent(this.parentBounds);
  }

  layoutWithinParent(bounds: ParentLayoutBounds): void {
    this.parentBounds = bounds;

    this.weatherTitle.position.set(PANEL_PADDING, PANEL_PADDING);
    this.weatherValues.position.set(
      PANEL_PADDING,
      PANEL_PADDING + this.weatherTitle.height + 4,
    );

    const panelHeight =
      this.weatherValues.y + this.weatherValues.height + PANEL_PADDING;

    this.background.clear();
    this.background
      .roundRect(0, 0, PANEL_WIDTH, panelHeight, 6)
      .fill(PANEL_BACKGROUND)
      .stroke({ width: 1, color: PANEL_BORDER });

    const margin = this.layoutConfig.margin ?? { x: 0, y: 0 };
    const anchorX = bounds.width * this.layoutConfig.anchor.x;
    const anchorY = bounds.height * this.layoutConfig.anchor.y;

    this.position.set(
      resolveHorizontalPosition(
        anchorX,
        PANEL_WIDTH,
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
  }
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

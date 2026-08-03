import { Container, Graphics, Text } from "pixi.js";
import type { WeatherModel } from "./WeatherModel";
import { DEFAULT_WEATHER_UI_LAYOUT, type WeatherUiLayoutConfig } from "./types";

const PANEL_PADDING = 10;
const PANEL_BACKGROUND = 0x111827;
const PANEL_BORDER = 0x374151;
const TITLE_COLOR = 0x93c5fd;
const TEXT_COLOR = 0xf9fafb;

interface ParentBounds {
  width: number;
  height: number;
}

export class WeatherView extends Container {
  private readonly layoutConfig: WeatherUiLayoutConfig;
  private readonly background = new Graphics();
  private readonly titleText = new Text({
    text: "Weather",
    style: { fill: TITLE_COLOR, fontFamily: "monospace", fontSize: 14 },
  });
  private readonly valuesText = new Text({
    text: "",
    style: { fill: TEXT_COLOR, fontFamily: "monospace", fontSize: 13 },
  });
  private parentBounds: ParentBounds = { width: 0, height: 0 };

  constructor(layoutConfig: WeatherUiLayoutConfig = DEFAULT_WEATHER_UI_LAYOUT) {
    super();

    this.layoutConfig = {
      ...DEFAULT_WEATHER_UI_LAYOUT,
      ...layoutConfig,
      margin: {
        x: layoutConfig.margin?.x ?? DEFAULT_WEATHER_UI_LAYOUT.margin?.x ?? 0,
        y: layoutConfig.margin?.y ?? DEFAULT_WEATHER_UI_LAYOUT.margin?.y ?? 0,
      },
    };

    this.eventMode = "none";
    this.addChild(this.background, this.titleText, this.valuesText);
  }

  syncFromModel(model: WeatherModel): void {
    this.valuesText.text = [
      `Wind: ${model.getCurrentWindStrength().toFixed(1)}`,
      `Temperature: ${model.getCurrentDegrees().toFixed(1)} °C`,
    ].join("\n");

    this.layoutWithinParent(this.parentBounds);
  }

  layoutWithinParent(bounds: ParentBounds): void {
    this.parentBounds = bounds;
    this.titleText.position.set(PANEL_PADDING, PANEL_PADDING);
    this.valuesText.position.set(
      PANEL_PADDING,
      PANEL_PADDING + this.titleText.height + 4,
    );

    const panelWidth =
      Math.max(this.titleText.width, this.valuesText.width) + PANEL_PADDING * 2;
    const panelHeight =
      this.valuesText.y + this.valuesText.height + PANEL_PADDING;

    this.background.clear();
    this.background
      .roundRect(0, 0, panelWidth, panelHeight, 6)
      .fill(PANEL_BACKGROUND)
      .stroke({ width: 1, color: PANEL_BORDER });

    const margin = this.layoutConfig.margin ?? { x: 0, y: 0 };
    const anchorX = bounds.width * this.layoutConfig.anchor.x;
    const anchorY = bounds.height * this.layoutConfig.anchor.y;

    this.position.set(
      resolvePosition(
        anchorX,
        panelWidth,
        this.layoutConfig.horizontalAlign,
        margin.x,
      ),
      resolvePosition(
        anchorY,
        panelHeight,
        this.layoutConfig.verticalAlign,
        margin.y,
      ),
    );
  }

  destroy(): void {
    super.destroy({ children: true });
  }
}

function resolvePosition(
  anchor: number,
  size: number,
  align: "start" | "center" | "end",
  margin: number,
): number {
  switch (align) {
    case "start":
      return anchor + margin;
    case "center":
      return anchor - size / 2 + margin;
    case "end":
      return anchor - size - margin;
  }
}

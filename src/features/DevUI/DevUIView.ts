import { Container, FederatedPointerEvent, Graphics, Text } from "pixi.js";
import { DevUIEventManager } from "./DevUIEventManager";
import type { DevUIModel } from "./DevUIModel";

const PANEL_PADDING = 8;
const PANEL_BACKGROUND = 0x111827;
const PANEL_BORDER = 0x374151;
const TEXT_COLOR = 0x00ff88;
const SECONDARY_TEXT_COLOR = 0xf9fafb;
const TRACK_COLOR = 0x374151;
const DISABLED_COLOR = 0x6b7280;
const PANEL_WIDTH = 224;
const CONTROL_WIDTH = PANEL_WIDTH - PANEL_PADDING * 2;
const CHECKBOX_SIZE = 16;

export class DevUIView extends Container {
  private readonly background: Graphics;
  private readonly statsText: Text;
  private readonly separator = new Graphics();
  private readonly weatherTitle: Text;
  private readonly overrideToggle = new Container();
  private readonly checkbox = new Graphics();
  private readonly checkmark = new Graphics();
  private readonly overrideLabel: Text;
  private readonly windSlider: DevSlider;
  private readonly degreesSlider: DevSlider;
  private readonly gameplaySeparator = new Graphics();
  private readonly gameplayTitle: Text;
  private readonly cardCostToggle = new Container();
  private readonly cardCostCheckbox = new Graphics();
  private readonly cardCostCheckmark = new Graphics();
  private readonly cardCostLabel: Text;
  private model: DevUIModel | null = null;

  constructor(private readonly eventManager: DevUIEventManager) {
    super();

    this.background = new Graphics();
    this.statsText = new Text({
      text: "FPS: 0\nRender CPU: 0.00 ms",
      style: {
        fill: TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: 14,
      },
    });
    this.weatherTitle = new Text({
      text: "Weather override",
      style: {
        fill: TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: 14,
      },
    });
    this.overrideLabel = new Text({
      text: "Enabled",
      style: {
        fill: SECONDARY_TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: 13,
      },
    });
    this.windSlider = new DevSlider("Wind", (windStrength) => {
      this.eventManager.emit("weather-override:wind-change", { windStrength });
    });
    this.degreesSlider = new DevSlider("Temperature", (degrees) => {
      this.eventManager.emit("weather-override:degrees-change", { degrees });
    });
    this.gameplayTitle = new Text({
      text: "Gameplay",
      style: {
        fill: TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: 14,
      },
    });
    this.cardCostLabel = new Text({
      text: "Free cards (no stamina)",
      style: {
        fill: SECONDARY_TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: 12,
      },
    });

    this.statsText.position.set(PANEL_PADDING, PANEL_PADDING);
    this.overrideLabel.position.set(CHECKBOX_SIZE + 7, 0);
    this.overrideToggle.addChild(
      this.checkbox,
      this.checkmark,
      this.overrideLabel,
    );
    this.cardCostLabel.position.set(CHECKBOX_SIZE + 7, 0);
    this.cardCostToggle.addChild(
      this.cardCostCheckbox,
      this.cardCostCheckmark,
      this.cardCostLabel,
    );
    this.addChild(
      this.background,
      this.statsText,
      this.separator,
      this.weatherTitle,
      this.overrideToggle,
      this.windSlider,
      this.degreesSlider,
      this.gameplaySeparator,
      this.gameplayTitle,
      this.cardCostToggle,
    );
    this.position.set(12, 12);
    this.bindEvents();
    this.layout();
    this.drawBackground();
  }

  syncFromModel(model: DevUIModel): void {
    this.model = model;
    const text = [
      `FPS: ${model.getFps()}`,
      `Render CPU: ${model.getAverageRenderTimeMs().toFixed(2)} ms`,
    ].join("\n");

    if (this.statsText.text !== text) {
      this.statsText.text = text;
      this.layout();
    }

    const enabled = model.isWeatherOverrideEnabled();
    this.drawCheckbox(enabled);
    this.drawCardCostCheckbox(model.areCardStaminaCostsDisabled());
    this.windSlider.setState(
      model.getNormalizedWindStrength(),
      model.getWindStrength().toFixed(1),
      enabled,
    );
    this.degreesSlider.setState(
      model.getNormalizedDegrees(),
      `${model.getDegrees().toFixed(1)} °C`,
      enabled,
    );
    this.drawBackground();
  }

  destroy(): void {
    this.unbindEvents();
    super.destroy({ children: true });
  }

  private bindEvents(): void {
    this.overrideToggle.eventMode = "static";
    this.overrideToggle.cursor = "pointer";
    this.overrideToggle.hitArea = {
      contains: (x: number, y: number) =>
        x >= 0 && x <= CONTROL_WIDTH && y >= 0 && y <= CHECKBOX_SIZE,
    };
    this.overrideToggle.on("pointerdown", this.onToggleOverride);
    this.cardCostToggle.eventMode = "static";
    this.cardCostToggle.cursor = "pointer";
    this.cardCostToggle.hitArea = {
      contains: (x: number, y: number) =>
        x >= 0 && x <= CONTROL_WIDTH && y >= 0 && y <= CHECKBOX_SIZE,
    };
    this.cardCostToggle.on("pointerdown", this.onToggleCardCost);
  }

  private unbindEvents(): void {
    this.overrideToggle.off("pointerdown", this.onToggleOverride);
    this.cardCostToggle.off("pointerdown", this.onToggleCardCost);
  }

  private readonly onToggleOverride = (): void => {
    if (!this.model) {
      return;
    }

    this.eventManager.emit("weather-override:toggle", {
      enabled: !this.model.isWeatherOverrideEnabled(),
    });
  };

  private readonly onToggleCardCost = (): void => {
    if (!this.model) {
      return;
    }

    this.eventManager.emit("card-stamina-cost:toggle", {
      disabled: !this.model.areCardStaminaCostsDisabled(),
    });
  };

  private layout(): void {
    const separatorY = this.statsText.y + this.statsText.height + 8;
    const titleY = separatorY + 8;
    const toggleY = titleY + this.weatherTitle.height + 8;
    const windY = toggleY + CHECKBOX_SIZE + 10;
    const degreesY = windY + this.windSlider.controlHeight + 8;
    const gameplaySeparatorY = degreesY + this.degreesSlider.controlHeight + 8;
    const gameplayTitleY = gameplaySeparatorY + 8;
    const cardCostY = gameplayTitleY + this.gameplayTitle.height + 8;

    this.separator.clear();
    this.separator
      .rect(PANEL_PADDING, separatorY, CONTROL_WIDTH, 1)
      .fill(PANEL_BORDER);
    this.weatherTitle.position.set(PANEL_PADDING, titleY);
    this.overrideToggle.position.set(PANEL_PADDING, toggleY);
    this.windSlider.position.set(PANEL_PADDING, windY);
    this.degreesSlider.position.set(PANEL_PADDING, degreesY);
    this.gameplaySeparator.clear();
    this.gameplaySeparator
      .rect(PANEL_PADDING, gameplaySeparatorY, CONTROL_WIDTH, 1)
      .fill(PANEL_BORDER);
    this.gameplayTitle.position.set(PANEL_PADDING, gameplayTitleY);
    this.cardCostToggle.position.set(PANEL_PADDING, cardCostY);
  }

  private drawCheckbox(enabled: boolean): void {
    drawCheckbox(this.checkbox, this.checkmark, enabled);
  }

  private drawCardCostCheckbox(enabled: boolean): void {
    drawCheckbox(this.cardCostCheckbox, this.cardCostCheckmark, enabled);
  }

  private drawBackground(): void {
    const height = this.cardCostToggle.y + CHECKBOX_SIZE + PANEL_PADDING;

    this.background.clear();
    this.background
      .roundRect(0, 0, PANEL_WIDTH, height, 6)
      .fill(PANEL_BACKGROUND)
      .stroke({ width: 1, color: PANEL_BORDER });
  }
}

function drawCheckbox(
  checkbox: Graphics,
  checkmark: Graphics,
  enabled: boolean,
): void {
  checkbox.clear();
  checkbox
    .roundRect(0, 0, CHECKBOX_SIZE, CHECKBOX_SIZE, 3)
    .fill(enabled ? TEXT_COLOR : PANEL_BACKGROUND)
    .stroke({ width: 1, color: enabled ? TEXT_COLOR : DISABLED_COLOR });

  checkmark.clear();
  if (enabled) {
    checkmark
      .moveTo(4, 8)
      .lineTo(7, 11)
      .lineTo(12, 5)
      .stroke({ width: 2, color: PANEL_BACKGROUND });
  }
}

class DevSlider extends Container {
  readonly controlHeight = 42;

  private readonly labelText: Text;
  private readonly valueText: Text;
  private readonly sliderArea = new Container();
  private readonly trackBackground = new Graphics();
  private readonly trackFill = new Graphics();
  private readonly thumb = new Graphics();
  private dragging = false;
  private enabled = false;

  constructor(
    label: string,
    private readonly onChange: (normalized: number) => void,
  ) {
    super();

    this.labelText = new Text({
      text: label,
      style: {
        fill: SECONDARY_TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: 12,
      },
    });
    this.valueText = new Text({
      text: "",
      style: {
        fill: SECONDARY_TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: 12,
      },
    });
    this.valueText.anchor.set(1, 0);
    this.valueText.position.set(CONTROL_WIDTH, 0);
    this.sliderArea.position.set(0, 18);
    this.sliderArea.addChild(this.trackBackground, this.trackFill, this.thumb);
    this.addChild(this.labelText, this.valueText, this.sliderArea);
    this.bindEvents();
  }

  setState(normalized: number, value: string, enabled: boolean): void {
    this.enabled = enabled;
    this.valueText.text = value;
    this.sliderArea.eventMode = enabled ? "static" : "none";
    this.sliderArea.cursor = enabled ? "pointer" : "default";
    this.alpha = enabled ? 1 : 0.45;
    this.draw(normalized);
  }

  destroy(): void {
    this.unbindEvents();
    super.destroy({ children: true });
  }

  private bindEvents(): void {
    this.sliderArea.hitArea = {
      contains: (x: number, y: number) =>
        x >= 0 && x <= CONTROL_WIDTH && y >= 0 && y <= 24,
    };
    this.sliderArea.on("pointerdown", this.onPointerDown);
    this.sliderArea.on("pointermove", this.onPointerMove);
    this.sliderArea.on("pointerup", this.onPointerUp);
    this.sliderArea.on("pointerupoutside", this.onPointerUp);
  }

  private unbindEvents(): void {
    this.sliderArea.off("pointerdown", this.onPointerDown);
    this.sliderArea.off("pointermove", this.onPointerMove);
    this.sliderArea.off("pointerup", this.onPointerUp);
    this.sliderArea.off("pointerupoutside", this.onPointerUp);
  }

  private readonly onPointerDown = (event: FederatedPointerEvent): void => {
    if (!this.enabled) {
      return;
    }

    this.dragging = true;
    this.updateFromPointer(event);
  };

  private readonly onPointerMove = (event: FederatedPointerEvent): void => {
    if (this.dragging) {
      this.updateFromPointer(event);
    }
  };

  private readonly onPointerUp = (): void => {
    this.dragging = false;
  };

  private updateFromPointer(event: FederatedPointerEvent): void {
    const localX = event.getLocalPosition(this.sliderArea).x;
    this.onChange(Math.min(1, Math.max(0, localX / CONTROL_WIDTH)));
  }

  private draw(normalized: number): void {
    const clamped = Math.min(1, Math.max(0, normalized));
    const trackY = 9;
    const fillWidth = CONTROL_WIDTH * clamped;

    this.trackBackground.clear();
    this.trackBackground
      .roundRect(0, trackY, CONTROL_WIDTH, 6, 3)
      .fill(TRACK_COLOR);
    this.trackFill.clear();
    if (fillWidth > 0) {
      this.trackFill.roundRect(0, trackY, fillWidth, 6, 3).fill(TEXT_COLOR);
    }
    this.thumb.clear();
    this.thumb
      .circle(fillWidth, 12, 7)
      .fill(this.enabled ? SECONDARY_TEXT_COLOR : DISABLED_COLOR);
  }
}

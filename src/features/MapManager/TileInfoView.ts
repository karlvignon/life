import { Container, Graphics, Text } from "pixi.js";
import type { Modifier } from "./model/modifiers/Modifier";
import { Tile } from "./model/Tile";
import type {
  HorizontalAlign,
  ParentLayoutBounds,
  TileInfoUiLayoutConfig,
  VerticalAlign,
} from "./types";
import { DEFAULT_TILE_INFO_UI_LAYOUT } from "./types";

const PANEL_WIDTH = 236;
const DEAD_PANEL_HEIGHT = 78;
const LIVING_PANEL_HEIGHT = 150;
const MODIFIERS_SECTION_GAP = 10;
const MODIFIERS_HEADER_HEIGHT = 18;
const MODIFIER_LINE_HEIGHT = 15;
const PANEL_PADDING = 16;
const PANEL_RADIUS = 10;
const PANEL_BACKGROUND = 0x0b1020;
const PANEL_BORDER = 0x293548;
const TEXT_PRIMARY = 0xf8fafc;
const TEXT_SECONDARY = 0x8290a7;
const BAR_BACKGROUND = 0x202b3d;
const EMPTY_ACCENT = 0x64748b;

export class TileInfoView extends Container {
  private readonly layoutConfig: TileInfoUiLayoutConfig;
  private readonly background = new Graphics();
  private readonly accent = new Graphics();
  private readonly statusDot = new Graphics();
  private readonly divider = new Graphics();
  private readonly lifeBarBackground = new Graphics();
  private readonly lifeBarFill = new Graphics();
  private readonly modifiersDivider = new Graphics();
  private readonly titleText = new Text({
    text: "",
    style: {
      fill: TEXT_PRIMARY,
      fontFamily: "Arial, sans-serif",
      fontSize: 18,
      fontWeight: "600",
    },
  });
  private readonly coordinatesText = new Text({
    text: "",
    style: {
      fill: TEXT_SECONDARY,
      fontFamily: "monospace",
      fontSize: 11,
      letterSpacing: 0.8,
    },
  });
  private readonly ownerText = new Text({
    text: "",
    style: {
      fill: TEXT_SECONDARY,
      fontFamily: "monospace",
      fontSize: 11,
    },
  });
  private readonly lifeLabel = new Text({
    text: "LIFE",
    style: {
      fill: TEXT_SECONDARY,
      fontFamily: "Arial, sans-serif",
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 1.4,
    },
  });
  private readonly lifeValue = new Text({
    text: "",
    style: {
      fill: TEXT_PRIMARY,
      fontFamily: "monospace",
      fontSize: 12,
      fontWeight: "600",
    },
  });
  private readonly modifiersLabel = new Text({
    text: "",
    style: {
      fill: TEXT_SECONDARY,
      fontFamily: "Arial, sans-serif",
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 1.4,
    },
  });
  private readonly modifiersText = new Text({
    text: "",
    style: {
      fill: TEXT_PRIMARY,
      fontFamily: "monospace",
      fontSize: 10,
      lineHeight: MODIFIER_LINE_HEIGHT,
      wordWrap: true,
      wordWrapWidth: PANEL_WIDTH - PANEL_PADDING * 2,
    },
  });
  private parentBounds: ParentLayoutBounds = { width: 0, height: 0 };
  private panelWidth = PANEL_WIDTH;
  private panelHeight = DEAD_PANEL_HEIGHT;

  constructor(
    layoutConfig: TileInfoUiLayoutConfig = DEFAULT_TILE_INFO_UI_LAYOUT,
  ) {
    super();

    this.layoutConfig = {
      ...DEFAULT_TILE_INFO_UI_LAYOUT,
      ...layoutConfig,
      margin: {
        x: layoutConfig.margin?.x ?? DEFAULT_TILE_INFO_UI_LAYOUT.margin?.x ?? 0,
        y: layoutConfig.margin?.y ?? DEFAULT_TILE_INFO_UI_LAYOUT.margin?.y ?? 0,
      },
    };

    this.addChild(
      this.background,
      this.accent,
      this.statusDot,
      this.titleText,
      this.coordinatesText,
      this.ownerText,
      this.divider,
      this.lifeLabel,
      this.lifeValue,
      this.lifeBarBackground,
      this.lifeBarFill,
      this.modifiersDivider,
      this.modifiersLabel,
      this.modifiersText,
    );
    this.visible = false;
  }

  setTile(tile: Tile | null, modifiers: ReadonlyArray<Modifier> = []): void {
    if (!tile) {
      this.visible = false;
      return;
    }

    const snapshot = tile.toSnapshot();
    const essence = snapshot.alive ? snapshot.essence : null;
    const accentColor = essence?.color ?? EMPTY_ACCENT;
    this.titleText.text = essence?.name ?? "Empty cell";
    this.coordinatesText.text = `X ${snapshot.x}   ·   Y ${snapshot.y}`;

    if (essence && snapshot.data) {
      if (!snapshot.provenance) {
        throw new Error("A living tile must have a provenance");
      }
      const { life, maximumLife } = snapshot.data;
      const lifeRatio =
        maximumLife > 0 ? Math.max(0, Math.min(1, life / maximumLife)) : 0;

      this.lifeValue.text = `${life} / ${maximumLife}`;
      this.ownerText.text = `OWNER  ${snapshot.provenance.playerId}`;
      this.ownerText.visible = true;
      this.setLifeElementsVisible(true);
      this.drawLifeBar(lifeRatio, accentColor);
    } else {
      this.ownerText.text = "";
      this.ownerText.visible = false;
      this.setLifeElementsVisible(false);
    }

    const baseHeight = essence ? LIVING_PANEL_HEIGHT : DEAD_PANEL_HEIGHT;
    const panelHeight = this.syncModifiers(modifiers, baseHeight);
    this.drawPanel(panelHeight, accentColor);

    this.visible = true;
    this.layoutWithinParent(this.parentBounds);
  }

  layoutWithinParent(bounds: ParentLayoutBounds): void {
    this.parentBounds = bounds;
    const margin = this.layoutConfig.margin ?? { x: 0, y: 0 };
    const maxWidth = this.layoutConfig.maxWidth ?? PANEL_WIDTH;
    const maxHeight = this.layoutConfig.maxHeight ?? LIVING_PANEL_HEIGHT;

    const scale = Math.min(
      1,
      maxWidth > 0 ? maxWidth / this.panelWidth : 1,
      maxHeight > 0 ? maxHeight / this.panelHeight : 1,
    );
    this.scale.set(scale);

    const renderedWidth = this.panelWidth * scale;
    const renderedHeight = this.panelHeight * scale;
    const anchorX = bounds.width * this.layoutConfig.anchor.x;
    const anchorY = bounds.height * this.layoutConfig.anchor.y;

    this.position.set(
      resolveHorizontalPosition(
        anchorX,
        renderedWidth,
        this.layoutConfig.horizontalAlign,
        margin.x,
      ),
      resolveVerticalPosition(
        anchorY,
        renderedHeight,
        this.layoutConfig.verticalAlign,
        margin.y,
      ),
    );
  }

  private drawPanel(height: number, accentColor: number): void {
    this.panelWidth = PANEL_WIDTH;
    this.panelHeight = height;

    this.background.clear();
    this.background
      .roundRect(0, 0, PANEL_WIDTH, height, PANEL_RADIUS)
      .fill({ color: PANEL_BACKGROUND, alpha: 0.96 })
      .stroke({ width: 1, color: PANEL_BORDER, alpha: 0.95 });

    this.accent.clear();
    this.accent.roundRect(0, 0, 4, height, 2).fill(accentColor);

    this.statusDot.clear();
    this.statusDot.circle(PANEL_PADDING + 3, 24, 3).fill(accentColor);

    this.titleText.position.set(PANEL_PADDING + 14, 13);
    this.coordinatesText.position.set(PANEL_PADDING + 14, 43);
    this.ownerText.position.set(PANEL_PADDING + 14, 59);
  }

  private drawLifeBar(lifeRatio: number, accentColor: number): void {
    const contentWidth = PANEL_WIDTH - PANEL_PADDING * 2;
    const barY = 127;
    const barHeight = 7;

    this.divider.clear();
    this.divider
      .rect(PANEL_PADDING, 92, contentWidth, 1)
      .fill({ color: PANEL_BORDER, alpha: 0.8 });

    this.lifeLabel.position.set(PANEL_PADDING, 103);
    this.lifeValue.anchor.set(1, 0);
    this.lifeValue.position.set(PANEL_WIDTH - PANEL_PADDING, 101);

    this.lifeBarBackground.clear();
    this.lifeBarBackground
      .roundRect(PANEL_PADDING, barY, contentWidth, barHeight, barHeight / 2)
      .fill(BAR_BACKGROUND);

    this.lifeBarFill.clear();
    const fillWidth = contentWidth * lifeRatio;
    if (fillWidth > 0) {
      this.lifeBarFill
        .roundRect(
          PANEL_PADDING,
          barY,
          fillWidth,
          barHeight,
          Math.min(fillWidth / 2, barHeight / 2),
        )
        .fill(accentColor);
    }
  }

  private setLifeElementsVisible(visible: boolean): void {
    this.divider.visible = visible;
    this.lifeLabel.visible = visible;
    this.lifeValue.visible = visible;
    this.lifeBarBackground.visible = visible;
    this.lifeBarFill.visible = visible;
  }

  private syncModifiers(
    modifiers: ReadonlyArray<Modifier>,
    baseHeight: number,
  ): number {
    const visible = modifiers.length > 0;
    this.modifiersDivider.visible = visible;
    this.modifiersLabel.visible = visible;
    this.modifiersText.visible = visible;

    if (!visible) {
      this.modifiersLabel.text = "";
      this.modifiersText.text = "";
      return baseHeight;
    }

    const contentWidth = PANEL_WIDTH - PANEL_PADDING * 2;
    this.modifiersDivider.clear();
    this.modifiersDivider
      .rect(PANEL_PADDING, baseHeight, contentWidth, 1)
      .fill({ color: PANEL_BORDER, alpha: 0.8 });

    this.modifiersLabel.text = `MODIFIERS (${modifiers.length})`;
    this.modifiersLabel.position.set(
      PANEL_PADDING,
      baseHeight + MODIFIERS_SECTION_GAP,
    );

    this.modifiersText.text = modifiers.map(formatModifier).join("\n");
    this.modifiersText.position.set(
      PANEL_PADDING,
      baseHeight + MODIFIERS_SECTION_GAP + MODIFIERS_HEADER_HEIGHT,
    );

    return (
      baseHeight +
      MODIFIERS_SECTION_GAP +
      MODIFIERS_HEADER_HEIGHT +
      Math.ceil(this.modifiersText.height) +
      PANEL_PADDING
    );
  }
}

export function formatModifier(modifier: Modifier): string {
  const property = modifier.property === "degrees" ? "Temperature" : "Wind";
  const value =
    modifier.mode === "proportional"
      ? formatSignedValue(modifier.value * 100, "%")
      : formatSignedValue(
          modifier.value,
          modifier.property === "degrees" ? "°C" : "",
        );
  const mode = modifier.mode === "proportional" ? "PROP" : "ABS";

  return `${property} ${value} ${mode} · ${modifier.author.essence.name} (${modifier.author.x},${modifier.author.y})`;
}

function formatSignedValue(value: number, unit: string): string {
  const sign = value > 0 ? "+" : "";
  const formattedValue = Number.isInteger(value)
    ? value.toString()
    : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `${sign}${formattedValue}${unit}`;
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

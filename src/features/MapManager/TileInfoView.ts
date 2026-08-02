import { Container, Graphics, Text } from "pixi.js";
import { Tile } from "./model/Tile";
import type {
  HorizontalAlign,
  ParentLayoutBounds,
  TileInfoUiLayoutConfig,
  VerticalAlign,
} from "./types";
import { DEFAULT_TILE_INFO_UI_LAYOUT } from "./types";

const PANEL_PADDING = 12;
const PANEL_BACKGROUND = 0x111827;
const PANEL_BORDER = 0x374151;
const TEXT_COLOR = 0xf9fafb;

export class TileInfoView extends Container {
  private readonly layoutConfig: TileInfoUiLayoutConfig;
  private readonly background: Graphics;
  private readonly infoText: Text;
  private parentBounds: ParentLayoutBounds = { width: 0, height: 0 };

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

    this.background = new Graphics();
    this.infoText = new Text({
      text: "",
      style: {
        fill: TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: 14,
        wordWrap: true,
      },
    });

    this.addChild(this.background, this.infoText);
    this.visible = false;
  }

  setTile(tile: Tile | null): void {
    if (!tile) {
      this.visible = false;
      return;
    }

    const snapshot = tile.toSnapshot();
    this.infoText.text = `x: ${snapshot.x}, y: ${snapshot.y}, alive: ${snapshot.alive}`;
    this.visible = true;
    this.layoutWithinParent(this.parentBounds);
  }

  layoutWithinParent(bounds: ParentLayoutBounds): void {
    this.parentBounds = bounds;
    const margin = this.layoutConfig.margin ?? { x: 0, y: 0 };
    const maxWidth = this.layoutConfig.maxWidth ?? Number.POSITIVE_INFINITY;
    const maxHeight = this.layoutConfig.maxHeight ?? Number.POSITIVE_INFINITY;

    const contentMaxWidth = Math.max(0, maxWidth - PANEL_PADDING * 2);
    const contentMaxHeight = Math.max(0, maxHeight - PANEL_PADDING * 2);

    this.infoText.style.wordWrapWidth = contentMaxWidth;
    this.infoText.scale.set(1);

    let contentWidth = this.infoText.width;
    let contentHeight = this.infoText.height;

    if (contentWidth > contentMaxWidth && contentMaxWidth > 0) {
      this.infoText.style.wordWrapWidth = contentMaxWidth;
      contentWidth = Math.min(this.infoText.width, contentMaxWidth);
    }

    if (contentHeight > contentMaxHeight && contentMaxHeight > 0) {
      const scale = contentMaxHeight / contentHeight;
      this.infoText.scale.set(scale);
      contentWidth *= scale;
      contentHeight = contentMaxHeight;
    }

    const panelWidth = Math.min(maxWidth, contentWidth + PANEL_PADDING * 2);
    const panelHeight = Math.min(maxHeight, contentHeight + PANEL_PADDING * 2);

    this.background.clear();
    this.background
      .roundRect(0, 0, panelWidth, panelHeight, 6)
      .fill(PANEL_BACKGROUND)
      .stroke({ width: 1, color: PANEL_BORDER });

    this.infoText.position.set(PANEL_PADDING, PANEL_PADDING);

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

import { Container } from "pixi.js";
import type { ToolbarButton } from "./createCellButtons";
import type { CreateButtonsUiLayoutConfig, ParentLayoutBounds } from "./types";
import { DEFAULT_CREATE_BUTTONS_UI_LAYOUT } from "./types";

export class CreateButtonsUi extends Container {
  private readonly buttons: ToolbarButton[];
  private readonly layoutConfig: CreateButtonsUiLayoutConfig;

  constructor(
    buttons: ToolbarButton[],
    layoutConfig: CreateButtonsUiLayoutConfig = DEFAULT_CREATE_BUTTONS_UI_LAYOUT,
  ) {
    super();

    this.buttons = buttons;
    this.layoutConfig = {
      ...DEFAULT_CREATE_BUTTONS_UI_LAYOUT,
      ...layoutConfig,
    };

    for (const button of this.buttons) {
      this.addChild(button);
    }
  }

  getButtons(): ReadonlyArray<ToolbarButton> {
    return this.buttons;
  }

  layoutWithinParent(bounds: ParentLayoutBounds): void {
    const gap = this.layoutConfig.buttonGap ?? 8;
    const marginBottom = this.layoutConfig.marginBottom ?? 12;

    let totalWidth = 0;
    let maxHeight = 0;

    for (const button of this.buttons) {
      totalWidth += button.width;
      maxHeight = Math.max(maxHeight, button.height);
    }

    totalWidth += gap * Math.max(0, this.buttons.length - 1);

    let x = (bounds.width - totalWidth) / 2;
    const y = bounds.height - maxHeight - marginBottom;

    for (const button of this.buttons) {
      button.position.set(x, y);
      x += button.width + gap;
    }
  }
}

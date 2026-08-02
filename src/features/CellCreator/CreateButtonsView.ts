import { Container } from "pixi.js";
import type { Essence } from "../MapManager/main";
import type { ToolbarButton } from "./CreateCellButtons";
import { isCreateCellButtonView } from "./CreateCellButtons";
import type { CreateButtonsUiLayoutConfig, ParentLayoutBounds } from "./types";
import type { PatternId } from "./types";
import { DEFAULT_CREATE_BUTTONS_UI_LAYOUT } from "./types";

export class CreateButtonsView extends Container {
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

  syncEssence(essence: Essence): void {
    for (const button of this.buttons) {
      if (isCreateCellButtonView(button)) {
        button.syncEssence(essence);
      }
    }
  }

  syncSelectedPattern(selectedPatternId: PatternId | null): void {
    for (const button of this.buttons) {
      if (isCreateCellButtonView(button)) {
        button.setActive(button.getPatternId() === selectedPatternId);
      }
    }
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

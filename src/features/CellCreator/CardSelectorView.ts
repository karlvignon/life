import { Container } from "pixi.js";
import type { Card } from "./Card";
import { CardView } from "./CardView";
import type { CellCreatorEventManager } from "./CellCreatorEventManager";
import { ClearButtonView } from "./ClearButtonView";
import {
  DEFAULT_CREATE_BUTTONS_UI_LAYOUT,
  type CardId,
  type CreateButtonsUiLayoutConfig,
  type EssenceFamilyId,
  type ParentLayoutBounds,
} from "./types";

export class CardSelectorView extends Container {
  private readonly cardViews: CardView[];
  private readonly clearButton: ClearButtonView;
  private readonly layoutConfig: CreateButtonsUiLayoutConfig;

  constructor(
    cards: ReadonlyArray<Card>,
    eventManager: CellCreatorEventManager,
    layoutConfig: CreateButtonsUiLayoutConfig = DEFAULT_CREATE_BUTTONS_UI_LAYOUT,
  ) {
    super();

    this.cardViews = cards.map((card) => new CardView(eventManager, card));
    this.clearButton = new ClearButtonView(eventManager);
    this.layoutConfig = {
      ...DEFAULT_CREATE_BUTTONS_UI_LAYOUT,
      ...layoutConfig,
    };

    this.addChild(...this.cardViews, this.clearButton);
  }

  syncSelectedEssence(selectedEssenceId: EssenceFamilyId): void {
    for (const cardView of this.cardViews) {
      cardView.setAvailable(cardView.getEssenceId() === selectedEssenceId);
    }
  }

  syncSelectedCard(selectedCardId: CardId | null): void {
    for (const cardView of this.cardViews) {
      cardView.setActive(cardView.getCardId() === selectedCardId);
    }
  }

  layoutWithinParent(bounds: ParentLayoutBounds): void {
    const gap = this.layoutConfig.buttonGap ?? 8;
    const marginBottom = this.layoutConfig.marginBottom ?? 12;
    const visibleButtons = [
      ...this.cardViews.filter((cardView) => cardView.visible),
      this.clearButton,
    ];

    let totalWidth = 0;
    let maxHeight = 0;

    for (const button of visibleButtons) {
      totalWidth += button.width;
      maxHeight = Math.max(maxHeight, button.height);
    }

    totalWidth += gap * Math.max(0, visibleButtons.length - 1);

    let x = (bounds.width - totalWidth) / 2;
    const y = bounds.height - maxHeight - marginBottom;

    for (const button of visibleButtons) {
      button.position.set(x, y);
      x += button.width + gap;
    }
  }
}

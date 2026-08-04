import {
  Application,
  Container,
  FederatedPointerEvent,
  Rectangle,
} from "pixi.js";
import type { EventBus } from "../../core/EventBus";
import type { GameEventMap } from "../../core/types/gameEvents";
import type { MapManager } from "../MapManager/main";
import { CardSelectorView } from "./CardSelectorView";
import {
  CARDS,
  DEFAULT_ESSENCE_DEFINITION,
  ESSENCE_DEFINITIONS,
  getCard,
  getEssenceDefinition,
} from "./Cards";
import { CellCreatorEventManager } from "./CellCreatorEventManager";
import { CellCreatorModel } from "./CellCreatorModel";
import { EssenceSelectorView } from "./EssenceSelectorView";
import { PlaceablePreviewView } from "./PlaceablePreviewView";

export class CellCreatorManager {
  private readonly app: Application;
  private readonly gameEventBus: EventBus;
  private readonly mapManager: MapManager;
  private readonly uiRootsToIgnore: Container[] = [];
  private readonly model = new CellCreatorModel(DEFAULT_ESSENCE_DEFINITION);
  private readonly eventManager = new CellCreatorEventManager();
  private readonly uiRoot: Container;
  private readonly view: CardSelectorView;
  private readonly essenceSelectorView: EssenceSelectorView;
  private readonly previewView = new PlaceablePreviewView();
  private boundMapView: Container | null = null;

  private readonly onResize = (): void => {
    this.layout();
  };

  private readonly onMapPointerDown = (event: FederatedPointerEvent): void => {
    if (this.isPointerOnUi(event)) {
      return;
    }

    const placement = this.model.createPlacement();
    if (!placement) {
      return;
    }

    this.mapManager.placePlaceable(placement);
  };

  constructor(
    app: Application,
    gameEventBus: EventBus,
    mapManager: MapManager,
  ) {
    this.app = app;
    this.gameEventBus = gameEventBus;
    this.mapManager = mapManager;

    this.uiRoot = new Container();
    this.uiRoot.label = "cellCreatorUiRoot";
    this.app.stage.addChild(this.uiRoot);
    this.uiRootsToIgnore.push(this.uiRoot);

    this.view = new CardSelectorView(CARDS, this.eventManager);
    this.essenceSelectorView = new EssenceSelectorView(
      ESSENCE_DEFINITIONS,
      this.eventManager,
    );
    this.uiRoot.addChild(this.view, this.essenceSelectorView);
    this.syncSelectionViews();

    this.bindEvents();
    this.layout();

    window.addEventListener("resize", this.onResize);
  }

  registerUiRootToIgnore(root: Container): void {
    this.uiRootsToIgnore.push(root);
  }

  getUiRoot(): Container {
    return this.uiRoot;
  }

  needsRender(): boolean {
    return this.model.getSelectedPlaceable() !== null;
  }

  render(): void {
    const mapView = this.mapManager.getMapView();
    const overlay = this.mapManager.getOverlayLayer();

    if (!mapView || !overlay) {
      return;
    }

    this.ensureMapViewEvents(mapView);

    if (!this.model.getSelectedPlaceable()) {
      if (this.previewView.parent) {
        overlay.removeChild(this.previewView);
      }
      this.previewView.visible = false;
      return;
    }

    const pointer = this.app.renderer.events.pointer.global;
    this.updatePreviewOrigin(pointer.x, pointer.y);

    if (this.previewView.parent !== overlay) {
      overlay.addChild(this.previewView);
    }

    const cellSize = this.mapManager.getCellSize();
    this.previewView.syncPreview(this.model.getPreviewPlaceable(), cellSize);
  }

  destroy(): void {
    window.removeEventListener("resize", this.onResize);
    this.unbindMapViewEvents();
    this.eventManager.destroy();

    this.previewView.destroy();
    this.view.destroy({ children: true });
    this.essenceSelectorView.destroy();
    this.uiRoot.removeChild(this.view);
    this.uiRoot.removeChild(this.essenceSelectorView);
    this.uiRoot.destroy({ children: true });
    this.app.stage.removeChild(this.uiRoot);
  }

  private bindEvents(): void {
    this.eventManager.on("card:select", ({ cardId }) => {
      const card = getCard(cardId);
      if (!card) {
        return;
      }

      this.model.toggleSelectedCard(card);
      this.publishSelectedPlaceable();
      this.syncSelectionViews();
    });

    this.eventManager.on("essence:select", ({ essenceId }) => {
      const definition = getEssenceDefinition(essenceId);
      if (!definition) {
        return;
      }

      this.model.setSelectedEssence(definition);
      this.publishSelectedPlaceable();
      this.syncSelectionViews();
      this.layout();
    });

    this.eventManager.on("map:clear", () => {
      this.mapManager.clearMap();
      this.model.clearSelectedCard();
      this.publishSelectedPlaceable();
      this.syncSelectionViews();
    });
  }

  private ensureMapViewEvents(mapView: Container): void {
    if (mapView === this.boundMapView) {
      return;
    }

    this.unbindMapViewEvents();
    this.boundMapView = mapView;
    mapView.eventMode = "static";
    mapView.on("pointerdown", this.onMapPointerDown);
  }

  private unbindMapViewEvents(): void {
    if (!this.boundMapView) {
      return;
    }

    this.boundMapView.off("pointerdown", this.onMapPointerDown);
    this.boundMapView = null;
  }

  private publishSelectedPlaceable(): void {
    this.gameEventBus.emit<GameEventMap["game:placeable-selected"]>(
      "game:placeable-selected",
      { placeable: this.model.getSelectedPlaceable() },
    );
  }

  private syncSelectionViews(): void {
    this.view.syncSelectedEssence(this.model.getSelectedEssenceDefinition().id);
    this.view.syncSelectedCard(this.model.getSelectedCardId());
    this.essenceSelectorView.syncSelectedEssence(
      this.model.getSelectedEssenceDefinition().id,
    );
  }

  private updatePreviewOrigin(globalX: number, globalY: number): void {
    if (!this.model.getSelectedPlaceable()) {
      return;
    }

    const gridPosition = this.mapManager.screenToGrid(globalX, globalY);
    this.model.setPreviewOrigin(gridPosition);
  }

  private isPointerOnUi(event: FederatedPointerEvent): boolean {
    let node = event.target as Container | null;

    while (node) {
      if (this.uiRootsToIgnore.includes(node)) {
        return true;
      }
      node = node.parent;
    }

    return false;
  }

  private layout(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    this.uiRoot.hitArea = new Rectangle(0, 0, width, height);
    this.view.layoutWithinParent({ width, height });
    this.essenceSelectorView.layoutWithinParent({ width, height });
    this.app.stage.addChild(this.uiRoot);
  }
}

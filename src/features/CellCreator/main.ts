import {
  Application,
  Container,
  FederatedPointerEvent,
  Rectangle,
} from "pixi.js";
import type { EventBus } from "../../core/EventBus";
import type { GameEventMap } from "../../core/types/gameEvents";
import type { Essence } from "../MapManager/Essence";
import type { MapManager } from "../MapManager/main";
import type { MapView } from "../MapManager/MapView";
import { Placeable } from "../MapManager/Placeable";
import { CellCreatorEventManager } from "./CellCreatorEventManager";
import { CellCreatorModel } from "./CellCreatorModel";
import {
  createToolbarButtons,
  isCreateCellUiButton,
} from "./createCellButtons";
import { CreateButtonsUi } from "./CreateButtonsUi";
import { PlaceablePreviewView } from "./PlaceablePreviewView";

export class CellCreatorManager {
  private readonly app: Application;
  private readonly gameEventBus: EventBus;
  private readonly mapManager: MapManager;
  private readonly uiRootsToIgnore: Container[] = [];
  private readonly model = new CellCreatorModel();
  private readonly eventManager = new CellCreatorEventManager();
  private readonly uiRoot: Container;
  private readonly view: CreateButtonsUi;
  private readonly previewView = new PlaceablePreviewView();
  private boundMapView: MapView | null = null;

  private readonly onResize = (): void => {
    this.layout();
  };

  private readonly onMapPointerDown = (event: FederatedPointerEvent): void => {
    if (this.isPointerOnUi(event)) {
      return;
    }

    const preview = this.model.getPreviewPlaceable();
    if (!preview) {
      return;
    }

    this.mapManager.placePlaceable(preview);
  };

  constructor(
    app: Application,
    gameEventBus: EventBus,
    mapManager: MapManager,
    defaultEssence: Essence,
  ) {
    this.app = app;
    this.gameEventBus = gameEventBus;
    this.mapManager = mapManager;

    this.uiRoot = new Container();
    this.uiRoot.label = "cellCreatorUiRoot";
    this.app.stage.addChild(this.uiRoot);
    this.uiRootsToIgnore.push(this.uiRoot);

    const buttons = createToolbarButtons(this.eventManager, defaultEssence);
    this.view = new CreateButtonsUi(buttons);
    this.uiRoot.addChild(this.view);

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

  render(): void {
    const mapView = this.mapManager.getMapView();
    if (!mapView) {
      return;
    }

    this.ensureMapViewEvents(mapView);

    const pointer = this.app.renderer.events.pointer.global;
    this.updatePreviewOrigin(pointer.x, pointer.y);

    if (this.previewView.parent !== mapView) {
      mapView.addChild(this.previewView);
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
    this.uiRoot.removeChild(this.view);
    this.uiRoot.destroy({ children: true });
    this.app.stage.removeChild(this.uiRoot);
  }

  private bindEvents(): void {
    this.eventManager.on("placeable:select", ({ placeable }) => {
      const current = this.model.getSelectedPlaceable();
      const next =
        current?.getPattern() === placeable.getPattern() ? null : placeable;

      this.setSelectedPlaceable(next);
    });

    this.eventManager.on("map:clear", () => {
      this.mapManager.clearMap();
      this.setSelectedPlaceable(null);
    });

    this.gameEventBus.on<GameEventMap["game:placeable-selected"]>(
      "game:placeable-selected",
      ({ placeable }) => {
        this.syncButtonActiveState(placeable);
      },
    );
  }

  private ensureMapViewEvents(mapView: MapView): void {
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

  private setSelectedPlaceable(placeable: Placeable | null): void {
    this.model.setSelectedPlaceable(placeable);

    this.gameEventBus.emit<GameEventMap["game:placeable-selected"]>(
      "game:placeable-selected",
      { placeable },
    );

    this.syncButtonActiveState(placeable);
  }

  private syncButtonActiveState(selected: Placeable | null): void {
    for (const button of this.view.getButtons()) {
      if (!isCreateCellUiButton(button)) {
        continue;
      }

      const isActive =
        selected !== null &&
        button.getPlaceable().getPattern() === selected.getPattern();
      button.setActive(isActive);
    }
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
    this.app.stage.addChild(this.uiRoot);
  }
}

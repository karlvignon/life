import {
  Application,
  Container,
  FederatedPointerEvent,
  Rectangle,
} from "pixi.js";
import type { EventBus } from "../../core/EventBus";
import type { GameEventMap } from "../../core/types/gameEvents";
import type { PlacementActor } from "../../core/types/player";
import { GAME_COMMANDS } from "../../core/controls";
import { ControlsModel, type ControlsReader } from "../../core/ControlsModel";
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
  private readonly unsubscribeCardStaminaCostChanged: () => void;
  private readonly unsubscribeControlBindingChanged: () => void;
  private cardStaminaCostDisabled = false;

  private readonly onResize = (): void => {
    this.layout();
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (
      event.code !==
        this.controls.getBinding(GAME_COMMANDS.rotatePlacementClockwise).code ||
      event.repeat ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      this.isKeyboardInputTarget(event.target) ||
      !this.model.getSelectedPlaceable()
    ) {
      return;
    }

    event.preventDefault();
    this.rotatePlacementClockwise();
  };

  private readonly onMapPointerDown = (event: FederatedPointerEvent): void => {
    if (
      event.button !==
        this.controls.getBinding(GAME_COMMANDS.placeSelectedCard).button ||
      this.isPointerOnUi(event)
    ) {
      return;
    }

    this.updatePreviewOrigin(event.global.x, event.global.y);
    const placement = this.model.createPlacement();
    const staminaCost = this.model.getSelectedCardStaminaCost();
    if (!placement || staminaCost === null) {
      return;
    }

    if (
      !this.mapManager.canPlacePlaceable(
        placement,
        this.placementActor.getPlayerId(),
      )
    ) {
      return;
    }

    if (
      !this.cardStaminaCostDisabled &&
      !this.placementActor.trySpendStamina(staminaCost)
    ) {
      return;
    }

    this.mapManager.placePlaceable(
      placement,
      this.placementActor.getPlayerId(),
    );
  };

  constructor(
    app: Application,
    gameEventBus: EventBus,
    mapManager: MapManager,
    private readonly placementActor: PlacementActor,
    private readonly controls: ControlsReader = new ControlsModel(),
  ) {
    this.app = app;
    this.gameEventBus = gameEventBus;
    this.mapManager = mapManager;

    this.uiRoot = new Container();
    this.uiRoot.label = "cellCreatorUiRoot";
    this.app.stage.addChild(this.uiRoot);
    this.uiRootsToIgnore.push(this.uiRoot);

    this.view = new CardSelectorView(
      CARDS,
      this.eventManager,
      this.controls.getBinding(GAME_COMMANDS.rotatePlacementClockwise).label,
    );
    this.essenceSelectorView = new EssenceSelectorView(
      ESSENCE_DEFINITIONS,
      this.eventManager,
    );
    this.uiRoot.addChild(this.view, this.essenceSelectorView);
    this.syncSelectionViews();

    this.bindEvents();
    this.unsubscribeCardStaminaCostChanged = this.gameEventBus.on<
      GameEventMap["dev:card-stamina-cost-changed"]
    >("dev:card-stamina-cost-changed", ({ disabled }) => {
      this.cardStaminaCostDisabled = disabled;
    });
    this.unsubscribeControlBindingChanged = this.controls.onBindingChanged(
      ({ command }) => {
        if (command !== GAME_COMMANDS.rotatePlacementClockwise) {
          return;
        }

        this.view.syncRotationShortcut(
          this.controls.getBinding(GAME_COMMANDS.rotatePlacementClockwise)
            .label,
        );
        this.layout();
      },
    );
    this.layout();

    window.addEventListener("resize", this.onResize);
    window.addEventListener("keydown", this.onKeyDown);
    this.app.renderer.events.rootBoundary.dispatch.on(
      "pointerdown",
      this.onMapPointerDown,
    );
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
    window.removeEventListener("keydown", this.onKeyDown);
    this.app.renderer.events.rootBoundary.dispatch.off(
      "pointerdown",
      this.onMapPointerDown,
    );
    this.unsubscribeCardStaminaCostChanged();
    this.unsubscribeControlBindingChanged();
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

    this.eventManager.on(GAME_COMMANDS.rotatePlacementClockwise, () => {
      this.rotatePlacementClockwise();
    });

    this.eventManager.on("map:clear", () => {
      this.mapManager.clearMap();
      this.model.clearSelectedCard();
      this.publishSelectedPlaceable();
      this.syncSelectionViews();
    });
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
    this.view.syncRotation(
      this.model.getPlacementRotation(),
      this.model.getSelectedPlaceable() !== null,
    );
    this.essenceSelectorView.syncSelectedEssence(
      this.model.getSelectedEssenceDefinition().id,
    );
  }

  private rotatePlacementClockwise(): void {
    if (!this.model.getSelectedPlaceable()) {
      return;
    }

    this.model.rotatePlacementClockwise();
    this.publishSelectedPlaceable();
    this.syncSelectionViews();
  }

  private isKeyboardInputTarget(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement)
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

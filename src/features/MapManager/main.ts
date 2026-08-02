import {
  Application,
  Container,
  FederatedPointerEvent,
  Rectangle,
} from "pixi.js";
import type { EventBus } from "../../core/EventBus";
import type { GameEventMap } from "../../core/types/gameEvents";
import { mergeChangeSets } from "./model/CellChangeSet";
import type { CellChangeSet } from "./model/CellChangeSet";
import { MapEventManager } from "./MapEventManager";
import { MapModel } from "./MapModel";
import { MapView } from "./MapView";
import { TileInfoView } from "./TileInfoView";
import { Builder } from "./model/Builder";
import { Placeable } from "./model/Placeable";
import { GameOfLifeEssence } from "./model/essences/GameOfLifeEssence";
import { GenesisSpaceship } from "./model/spaceships/GenesisSpaceship";
import { Spaceship } from "./model/spaceships/Spaceship";
import { Tile } from "./model/Tile";
import {
  mergeRenderDeltas,
  type MapRenderDelta,
  type MapRenderUpdate,
} from "./render/types";
import { computeGridSize, DEFAULT_CELL_SIZE, type MapConfig } from "./types";
import { ChunkRenderDebugModel } from "./ChunkRenderDebugModel";
import { ChunkRenderDebugView } from "./ChunkRenderDebugView";

const DEFAULT_MAX_STEPS_PER_FRAME = 10;

export type { MapConfig, TileSnapshot, TileInfoUiLayoutConfig } from "./types";
export type { CellOffset } from "../../core/types/grid";
export { DEFAULT_TILE_INFO_UI_LAYOUT } from "./types";
export { Tile } from "./model/Tile";
export { Placeable } from "./model/Placeable";
export type { Essence } from "./model/essences/Essence";
export {
  GameOfLifeEssence,
  DEFAULT_GAME_OF_LIFE_COLOR,
} from "./model/essences/GameOfLifeEssence";
export {
  HighLifeEssence,
  DEFAULT_HIGHLIFE_COLOR,
} from "./model/essences/HighLifeEssence";
export {
  StaticEssence,
  DEFAULT_STATIC_COLOR,
} from "./model/essences/StaticEssence";
export {
  MushroomEssence,
  DEFAULT_MUSHROOM_COLOR,
} from "./model/essences/MushroomEssence";
export { Pattern } from "./model/patterns/Pattern";
export { RlePattern } from "./model/patterns/RlePattern";
export { BlinkerOscillator } from "./model/patterns/BlinkerOscillator";
export { HighLifeReplicator } from "./model/patterns/HighLifeReplicator";
export { ToadOscillator } from "./model/patterns/ToadOscillator";
export { SingleCellPattern } from "./model/patterns/SingleCellPattern";
export { Spaceship } from "./model/spaceships/Spaceship";
export { GenesisSpaceship } from "./model/spaceships/GenesisSpaceship";
export { GliderSpaceship } from "./model/spaceships/GliderSpaceship";
export { LightweightSpaceship } from "./model/spaceships/LightweightSpaceship";
export { MiddleweightSpaceship } from "./model/spaceships/MiddleweightSpaceship";

export class MapManager {
  private readonly app: Application;
  private readonly stage: Container;
  private readonly uiRoot: Container;
  private readonly cellSize: number;
  private readonly initialSpaceship: Spaceship;
  private readonly maxStepsPerFrame: number;
  private readonly builder = new Builder();
  private readonly eventManager = new MapEventManager();
  private readonly chunkRenderDebugModel = new ChunkRenderDebugModel();
  private readonly chunkRenderDebugView: ChunkRenderDebugView;

  private model: MapModel | null = null;
  private mapView: MapView | null = null;
  private readonly tileInfoUi: TileInfoView;
  private readonly gameEventBus: EventBus | null;
  private seeded = false;
  private stepsPerSecond = 0;
  private evolutionAccumulatorMs = 0;

  private renderDirty = false;
  private pendingUpdate: MapRenderUpdate | null = null;
  private pendingDelta: MapRenderDelta | null = null;
  private lastHoveredTile: Tile | null = null;
  private chunkRenderDebugEnabled = false;
  private chunkRenderDebugDirty = false;

  private readonly onResize = (): void => {
    this.layout();
  };

  constructor(
    app: Application,
    config: MapConfig = {},
    gameEventBus: EventBus | null = null,
    maxStepsPerFrame = DEFAULT_MAX_STEPS_PER_FRAME,
  ) {
    this.app = app;
    this.stage = app.stage;
    this.gameEventBus = gameEventBus;
    this.cellSize = config.cellSize ?? DEFAULT_CELL_SIZE;
    this.chunkRenderDebugView = new ChunkRenderDebugView(this.cellSize);
    this.maxStepsPerFrame = maxStepsPerFrame;
    const defaultEssence = config.defaultEssence ?? new GameOfLifeEssence();
    this.initialSpaceship =
      config.initialSpaceship ?? new GenesisSpaceship(defaultEssence);

    this.uiRoot = new Container();
    this.uiRoot.label = "uiRoot";
    this.stage.addChild(this.uiRoot);

    this.tileInfoUi = new TileInfoView(config.tileInfoLayout);
    this.uiRoot.addChild(this.tileInfoUi);

    this.bindEvents();

    this.layout();
    requestAnimationFrame(() => {
      this.layout();
    });
    window.addEventListener("resize", this.onResize);
  }

  update(dtMs: number): void {
    if (
      this.chunkRenderDebugEnabled &&
      this.chunkRenderDebugModel.update(dtMs)
    ) {
      this.chunkRenderDebugDirty = true;
    }

    if (!this.model || this.stepsPerSecond <= 0) {
      return;
    }

    const stepIntervalMs = 1000 / this.stepsPerSecond;
    this.evolutionAccumulatorMs += dtMs;

    let stepsThisFrame = 0;
    let frameChanges: CellChangeSet | null = null;

    while (
      this.evolutionAccumulatorMs >= stepIntervalMs &&
      stepsThisFrame < this.maxStepsPerFrame
    ) {
      const stepDelta = this.model.step();
      frameChanges = mergeChangeSets(frameChanges, stepDelta);
      this.evolutionAccumulatorMs -= stepIntervalMs;
      stepsThisFrame++;
    }

    if (this.evolutionAccumulatorMs >= stepIntervalMs) {
      this.evolutionAccumulatorMs = stepIntervalMs;
    }

    if (frameChanges && frameChanges.changes.length > 0) {
      this.queueDelta(frameChanges);
    }
  }

  render(): void {
    if (!this.mapView || !this.model) {
      return;
    }

    if (this.renderDirty && this.pendingUpdate) {
      const renderedChunks = this.mapView.applyUpdate(this.pendingUpdate);

      if (this.chunkRenderDebugEnabled) {
        this.chunkRenderDebugModel.flash(renderedChunks);
        this.chunkRenderDebugDirty = true;
      }

      this.renderDirty = false;
      this.pendingUpdate = null;
      this.pendingDelta = null;
    }

    if (this.chunkRenderDebugEnabled && this.chunkRenderDebugDirty) {
      this.chunkRenderDebugView.syncFromModel(
        this.chunkRenderDebugModel,
        this.model.gridWidth,
        this.model.gridHeight,
      );
      this.chunkRenderDebugDirty = false;
    }
  }

  needsRender(): boolean {
    return this.renderDirty || this.chunkRenderDebugDirty;
  }

  setChunkRenderDebugEnabled(enabled: boolean): void {
    this.chunkRenderDebugEnabled = enabled;
    this.chunkRenderDebugView.visible = enabled;

    if (!enabled) {
      this.chunkRenderDebugModel.clear();
      this.chunkRenderDebugView.clear();
      this.chunkRenderDebugDirty = false;
    }
  }

  getModel(): MapModel | null {
    return this.model;
  }

  getMapView(): MapView | null {
    return this.mapView;
  }

  getOverlayLayer(): Container | null {
    return this.mapView?.getOverlayLayer() ?? null;
  }

  getUiRoot(): Container {
    return this.uiRoot;
  }

  getCellSize(): number {
    return this.cellSize;
  }

  screenToGrid(
    globalX: number,
    globalY: number,
  ): { x: number; y: number } | null {
    if (!this.mapView || !this.model) {
      return null;
    }

    const local = this.mapView.toLocal({ x: globalX, y: globalY });
    const gridX = Math.floor(local.x / this.cellSize);
    const gridY = Math.floor(local.y / this.cellSize);

    if (
      gridX < 0 ||
      gridY < 0 ||
      gridX >= this.model.gridWidth ||
      gridY >= this.model.gridHeight
    ) {
      return null;
    }

    return { x: gridX, y: gridY };
  }

  placePlaceable(placeable: Placeable): void {
    if (!this.model) {
      return;
    }

    const changes = this.builder.place(this.model, placeable);
    this.queueDelta(changes);
  }

  clearMap(): void {
    if (!this.model) {
      return;
    }

    const changes = this.model.clearLivingCells();
    this.queueDelta(changes);
  }

  destroy(): void {
    window.removeEventListener("resize", this.onResize);
    this.unbindMapPointerEvents();
    this.eventManager.destroy();
    this.chunkRenderDebugView.destroy();

    if (this.mapView) {
      this.mapView.destroyGrid();
      this.stage.removeChild(this.mapView);
      this.mapView.destroy({ children: true });
      this.mapView = null;
    }

    this.tileInfoUi.destroy({ children: true });
    this.uiRoot.removeChild(this.tileInfoUi);
    this.uiRoot.destroy({ children: true });
    this.stage.removeChild(this.uiRoot);
    this.model = null;
  }

  private bindEvents(): void {
    this.eventManager.on("tile:hover", (tile) => {
      this.tileInfoUi.setTile(tile);
    });

    this.eventManager.on("tile:leave", () => {
      this.tileInfoUi.setTile(null);
    });

    this.gameEventBus?.on<GameEventMap["game:speed-changed"]>(
      "game:speed-changed",
      ({ speed }) => {
        this.stepsPerSecond = speed;
      },
    );
  }

  private bindMapPointerEvents(): void {
    if (!this.mapView) {
      return;
    }

    this.mapView.eventMode = "static";
    this.mapView.on("pointermove", this.onMapPointerMove);
    this.mapView.on("pointerout", this.onMapPointerOut);
  }

  private unbindMapPointerEvents(): void {
    if (!this.mapView) {
      return;
    }

    this.mapView.off("pointermove", this.onMapPointerMove);
    this.mapView.off("pointerout", this.onMapPointerOut);
    this.mapView.eventMode = "passive";
  }

  private readonly onMapPointerMove = (event: FederatedPointerEvent): void => {
    if (!this.model) {
      return;
    }

    const grid = this.screenToGrid(event.globalX, event.globalY);
    if (!grid) {
      this.emitTileLeave();
      return;
    }

    const tile = this.model.getTile(grid.x, grid.y);
    if (!tile || tile === this.lastHoveredTile) {
      return;
    }

    this.lastHoveredTile = tile;
    this.eventManager.emit("tile:hover", tile);
  };

  private readonly onMapPointerOut = (): void => {
    this.emitTileLeave();
  };

  private emitTileLeave(): void {
    if (!this.lastHoveredTile) {
      return;
    }

    this.lastHoveredTile = null;
    this.eventManager.emit("tile:leave", undefined);
  }

  private layout(): void {
    const { gridWidth, gridHeight } = computeGridSize(
      this.app.screen.width,
      this.app.screen.height,
      this.cellSize,
    );

    if (!this.model) {
      this.model = new MapModel(gridWidth, gridHeight);
      this.mapView = new MapView(this.cellSize);
      this.mapView.getOverlayLayer().addChild(this.chunkRenderDebugView);
      this.stage.addChild(this.mapView);
      this.bindMapPointerEvents();
    } else {
      const resizeSnapshot = this.model.resize(gridWidth, gridHeight);
      if (resizeSnapshot) {
        this.queueFullSnapshot();
      }
    }

    this.applyInitialCells();
    this.centerMap();
    this.layoutUiRoot();

    if (!this.renderDirty) {
      this.queueFullSnapshot();
    }

    this.render();
  }

  private layoutUiRoot(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    this.uiRoot.hitArea = new Rectangle(0, 0, width, height);
    this.tileInfoUi.layoutWithinParent({ width, height });
    this.stage.addChild(this.uiRoot);
  }

  private applyInitialCells(): void {
    if (this.seeded || !this.model) {
      return;
    }

    if (this.model.gridWidth === 0 || this.model.gridHeight === 0) {
      return;
    }

    const placeable = Placeable.centerOnGrid(
      this.initialSpaceship,
      this.model.gridWidth,
      this.model.gridHeight,
    );
    const changes = this.builder.build(this.model, placeable);
    this.queueDelta(changes);

    this.seeded = true;
  }

  private centerMap(): void {
    if (!this.mapView || !this.model) {
      return;
    }

    const usedWidth = this.model.gridWidth * this.cellSize;
    const usedHeight = this.model.gridHeight * this.cellSize;

    this.mapView.position.set(
      (this.app.screen.width - usedWidth) / 2,
      (this.app.screen.height - usedHeight) / 2,
    );
  }

  private queueFullSnapshot(): void {
    if (!this.model) {
      return;
    }

    this.pendingUpdate = {
      kind: "full",
      snapshot: this.model.createRenderSnapshot(this.cellSize),
    };
    this.pendingDelta = null;
    this.renderDirty = true;
  }

  private queueDelta(changeSet: CellChangeSet): void {
    if (!this.model || changeSet.changes.length === 0) {
      return;
    }

    const nextDelta: MapRenderDelta = {
      revision: this.model.getRenderRevision(),
      changedCells: this.model.cellChangesToVisualStates(changeSet),
    };

    this.pendingDelta = mergeRenderDeltas(this.pendingDelta, nextDelta);
    this.pendingUpdate = { kind: "delta", delta: this.pendingDelta };
    this.renderDirty = true;
  }
}

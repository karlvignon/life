import {
  Application,
  Container,
  FederatedPointerEvent,
  Rectangle,
} from "pixi.js";
import type { WeatherSnapshot } from "../../core/types/weather";
import { ChunkRenderDebugModel } from "./ChunkRenderDebugModel";
import { ChunkRenderDebugView } from "./ChunkRenderDebugView";
import { MapEventManager } from "./MapEventManager";
import { MapModel } from "./MapModel";
import { MapView } from "./MapView";
import { ReproductibilityMapView } from "./ReproductibilityMapView";
import { TileInfoView } from "./TileInfoView";
import type { CellChangeSet } from "./model/CellChangeSet";
import { Placeable } from "./model/Placeable";
import { Tile } from "./model/Tile";
import { GameOfLifeEssence } from "./model/essences/GameOfLifeEssence";
import {
  mergeRenderDeltas,
  type MapRenderDelta,
  type MapRenderUpdate,
} from "./render/types";
import { computeGridSize, DEFAULT_CELL_SIZE, type MapConfig } from "./types";

export type { CellOffset } from "../../core/types/grid";
export { ReproductibilityMapView } from "./ReproductibilityMapView";
export { Placeable } from "./model/Placeable";
export { Tile } from "./model/Tile";
export {
  TileData,
  type TileDataDelta,
  type TileDataProperties
} from "./model/TileData";
export {
  Essence,
  type EssenceBirth,
  type EssenceDefinition,
  type EssenceEvolutionInput,
  type EssenceEvolutionResult,
  type EssenceProperties,
  type EssencePropertiesDelta,
  type EvolutionBehavior,
  type EvolutionProposal,
  type WeatherBehavior
} from "./model/essences/Essence";
export {
  createEssence,
  essenceCatalog,
  EssenceCatalog,
  type EssenceFactory
} from "./model/essences/EssenceCatalog";
export {
  DEFAULT_FLORA_COLOR,
  FLORA_BIRTH_PATTERN,
  FloraEssence
} from "./model/essences/FloraEssence";
export {
  DEFAULT_GAME_OF_LIFE_COLOR,
  GameOfLifeEssence
} from "./model/essences/GameOfLifeEssence";
export {
  DEFAULT_HIGHLIFE_COLOR,
  HighLifeEssence
} from "./model/essences/HighLifeEssence";
export {
  DEFAULT_MUSHROOM_COLOR,
  MUSHROOM_BIRTH_PATTERN, MUSHROOM_COLD_LIFE_LOSS, MUSHROOM_COLD_THRESHOLD_DEGREES, MUSHROOM_WEATHER_REPERCUSSION_INTERVAL,
  MushroomEssence
} from "./model/essences/MushroomEssence";
export {
  MUSHROOM_SPROUT_BIRTH_PATTERN,
  MushroomSproutEssence
} from "./model/essences/MushroomSproutEssence";
export {
  DEFAULT_STATIC_COLOR,
  StaticEssence
} from "./model/essences/StaticEssence";
export {
  DEFAULT_TREE_COLOR,
  TREE_BIRTH_PATTERN,
  TREE_NEIGHBOR_DEGREES_MODIFIER,
  TreeEssence
} from "./model/essences/TreeEssence";
export {
  createLifeLikeBehavior,
  type LifeLikeRules
} from "./model/evolution/behaviors/LifeLikeBehavior";
export {
  createPatternBirthBehavior,
  freezeBirthPattern,
  type BirthPattern
} from "./model/evolution/behaviors/PatternBirthBehavior";
export {
  Modifier,
  type ModifierAuthor,
  type ModifierDefinition,
  type ModifierMode,
  type WeatherProperty
} from "./model/modifiers/Modifier";
export { EncodedPattern } from "./model/patterns/EncodedPattern";
export { Pattern } from "./model/patterns/Pattern";
export {
  createPattern,
  patternCatalog,
  PatternCatalog,
  type EncodedPatternDefinition
} from "./model/patterns/PatternCatalog";
export {
  parsePatternEncoding,
  type ParsedPatternEncoding,
  type PatternEncoding
} from "./model/patterns/PatternEncoding";
export { DEFAULT_TILE_INFO_UI_LAYOUT } from "./types";
export type { MapConfig, TileInfoUiLayoutConfig, TileSnapshot } from "./types";

export class MapManager {
  private readonly app: Application;
  private readonly stage: Container;
  private readonly uiRoot: Container;
  private readonly cellSize: number;
  private readonly eventManager = new MapEventManager();
  private readonly chunkRenderDebugModel = new ChunkRenderDebugModel();
  private readonly chunkRenderDebugView: ChunkRenderDebugView;
  private readonly reproductibilityMapView: ReproductibilityMapView;

  private model: MapModel | null = null;
  private mapView: MapView | null = null;
  private readonly tileInfoUi: TileInfoView;
  private seeded = false;

  private renderDirty = false;
  private pendingUpdate: MapRenderUpdate | null = null;
  private pendingDelta: MapRenderDelta | null = null;
  private lastHoveredTile: Tile | null = null;
  private tileInfoDirty = false;
  private chunkRenderDebugEnabled = false;
  private chunkRenderDebugDirty = false;
  private reproductibilityMapEnabled = false;
  private reproductibilityMapDirty = false;

  private readonly onResize = (): void => {
    this.layout();
  };

  constructor(app: Application, config: MapConfig = {}) {
    this.app = app;
    this.stage = app.stage;
    this.cellSize = config.cellSize ?? DEFAULT_CELL_SIZE;
    this.chunkRenderDebugView = new ChunkRenderDebugView(this.cellSize);
    this.reproductibilityMapView = new ReproductibilityMapView(this.cellSize);
    const defaultEssence = config.defaultEssence ?? new GameOfLifeEssence();
    this.initialEssence = defaultEssence;

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
  }

  step(currentCycle: number, weather: Readonly<WeatherSnapshot>): void {
    if (!this.model) {
      return;
    }

    this.queueDelta(this.model.step(currentCycle, weather));
    this.tileInfoDirty = this.lastHoveredTile !== null;
    this.reproductibilityMapDirty = this.reproductibilityMapEnabled;
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

    if (this.reproductibilityMapEnabled && this.reproductibilityMapDirty) {
      this.reproductibilityMapView.sync(
        this.model.createReproductibilityMapSnapshot(),
      );
      this.reproductibilityMapDirty = false;
    }

    if (this.tileInfoDirty) {
      this.tileInfoUi.setTile(this.lastHoveredTile);
      this.tileInfoDirty = false;
    }
  }

  needsRender(): boolean {
    return (
      this.renderDirty ||
      this.chunkRenderDebugDirty ||
      this.reproductibilityMapDirty ||
      this.tileInfoDirty
    );
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

  setReproductibilityMapEnabled(enabled: boolean): void {
    this.reproductibilityMapEnabled = enabled;
    this.reproductibilityMapView.visible = enabled;

    if (enabled) {
      this.reproductibilityMapDirty = true;
      return;
    }

    this.reproductibilityMapView.clear();
    this.reproductibilityMapDirty = false;
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

    const changes = this.model.placeCells(
      placeable.getWorldCells(),
      placeable.getEssence(),
    );
    this.queueDelta(changes);
    this.tileInfoDirty = this.lastHoveredTile !== null;
    this.reproductibilityMapDirty = this.reproductibilityMapEnabled;
  }

  clearMap(): void {
    if (!this.model) {
      return;
    }

    const changes = this.model.clearLivingCells();
    this.queueDelta(changes);
    this.tileInfoDirty = this.lastHoveredTile !== null;
    this.reproductibilityMapDirty = this.reproductibilityMapEnabled;
  }

  destroy(): void {
    window.removeEventListener("resize", this.onResize);
    this.unbindMapPointerEvents();
    this.eventManager.destroy();
    this.chunkRenderDebugView.destroy();
    this.reproductibilityMapView.destroy();

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
      this.mapView
        .getOverlayLayer()
        .addChild(this.reproductibilityMapView, this.chunkRenderDebugView);
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
    this.reproductibilityMapDirty = this.reproductibilityMapEnabled;
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

import {
  Application,
  Container,
  FederatedPointerEvent,
  Rectangle,
} from "pixi.js";
import type { WeatherSnapshot } from "../../core/types/weather";
import type { PlayerId } from "../../core/types/player";
import type { TeamResolver } from "../../core/types/team";
import { ChunkRenderDebugModel } from "./ChunkRenderDebugModel";
import { ChunkRenderDebugView } from "./ChunkRenderDebugView";
import { MapEventManager } from "./MapEventManager";
import { MapModel } from "./MapModel";
import { MapView } from "./MapView";
import { ReproductibilityMapView } from "./ReproductibilityMapView";
import { SeedRangeMapView } from "./SeedRangeMapView";
import { TileInfoView } from "./TileInfoView";
import type { CellChangeSet } from "./model/CellChangeSet";
import { Placeable } from "./model/Placeable";
import { Tile } from "./model/Tile";
import {
  mergeRenderDeltas,
  type MapRenderDelta,
  type MapRenderUpdate,
} from "./render/types";
import {
  computeGridSize,
  DEFAULT_CELL_SIZE,
  type MapConfig,
  type TileSnapshot,
} from "./types";

export type { CellOffset } from "../../core/types/grid";
export { ReproductibilityMapView } from "./ReproductibilityMapView";
export { SeedRangeMapView } from "./SeedRangeMapView";
export { Placeable } from "./model/Placeable";
export type { PlaceableRotation } from "./model/Placeable";
export { Tile } from "./model/Tile";
export {
  TileData,
  type TileDataDelta,
  type TileDataProperties,
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
  type WeatherBehavior,
} from "./model/essences/Essence";
export {
  BLIND_SEEDING_BEHAVIOR_ID,
  BlindSeeding,
} from "./model/behaviors/BlindSeeding";
export { SEED_RANGE_BEHAVIOR_ID, SeedRange } from "./model/behaviors/SeedRange";
export type { TileBehavior } from "./model/behaviors/TileBehavior";
export {
  createTileBehavior,
  createTileBehaviors,
  tileBehaviorFactory,
  TileBehaviorFactory,
  type TileBehaviorCreator,
  type TileBehaviorType,
} from "./model/behaviors/TileBehaviorFactory";
export {
  createEssence,
  essenceCatalog,
  EssenceCatalog,
  type EssenceFactory,
} from "./model/essences/EssenceCatalog";
export {
  DEFAULT_FLORA_COLOR,
  FLORA_BIRTH_PATTERN,
  FloraEssence,
} from "./model/essences/FloraEssence";
export {
  DEFAULT_GAME_OF_LIFE_COLOR,
  GameOfLifeEssence,
} from "./model/essences/GameOfLifeEssence";
export {
  DEFAULT_HIGHLIFE_COLOR,
  HighLifeEssence,
} from "./model/essences/HighLifeEssence";
export {
  DEFAULT_MUSHROOM_COLOR,
  MUSHROOM_BIRTH_PATTERN,
  MUSHROOM_COLD_LIFE_LOSS,
  MUSHROOM_COLD_THRESHOLD_DEGREES,
  MUSHROOM_WEATHER_REPERCUSSION_INTERVAL,
  MushroomEssence,
} from "./model/essences/MushroomEssence";
export {
  MUSHROOM_SPROUT_BIRTH_PATTERN,
  MushroomSproutEssence,
} from "./model/essences/MushroomSproutEssence";
export {
  DEFAULT_STATIC_COLOR,
  StaticEssence,
} from "./model/essences/StaticEssence";
export {
  DEFAULT_TREE_COLOR,
  TREE_BIRTH_PATTERN,
  TREE_NEIGHBOR_DEGREES_MODIFIER,
  TreeEssence,
} from "./model/essences/TreeEssence";
export {
  createLifeLikeBehavior,
  type LifeLikeRules,
} from "./model/evolution/behaviors/LifeLikeBehavior";
export {
  createPatternBirthBehavior,
  freezeBirthPattern,
  type BirthPattern,
} from "./model/evolution/behaviors/PatternBirthBehavior";
export {
  Modifier,
  type ModifierAuthor,
  type ModifierDefinition,
  type ModifierMode,
  type WeatherProperty,
} from "./model/modifiers/Modifier";
export { EncodedPattern } from "./model/patterns/EncodedPattern";
export { Pattern } from "./model/patterns/Pattern";
export {
  createPattern,
  patternCatalog,
  PatternCatalog,
  type EncodedPatternDefinition,
} from "./model/patterns/PatternCatalog";
export {
  parsePatternEncoding,
  type ParsedPatternEncoding,
  type PatternEncoding,
} from "./model/patterns/PatternEncoding";
export { DEFAULT_TILE_INFO_UI_LAYOUT } from "./types";
export type {
  MapConfig,
  TileInfoUiLayoutConfig,
  TileProvenance,
  TileSnapshot,
} from "./types";

export class MapManager {
  private readonly app: Application;
  private readonly stage: Container;
  private readonly uiRoot: Container;
  private readonly cellSize: number;
  private readonly eventManager = new MapEventManager();
  private readonly chunkRenderDebugModel = new ChunkRenderDebugModel();
  private readonly chunkRenderDebugView: ChunkRenderDebugView;
  private readonly reproductibilityMapView: ReproductibilityMapView;
  private readonly seedRangeMapView: SeedRangeMapView;

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
  private seedRangeMapEnabled = false;
  private seedRangeMapDirty = false;
  private seedRangePlayerId: PlayerId | null = null;
  private teamColorsEnabled = false;

  private readonly onResize = (): void => {
    this.layout();
  };

  constructor(
    app: Application,
    config: MapConfig = {},
    private readonly teamResolver?: TeamResolver,
  ) {
    this.app = app;
    this.stage = app.stage;
    this.cellSize = config.cellSize ?? DEFAULT_CELL_SIZE;
    this.chunkRenderDebugView = new ChunkRenderDebugView(this.cellSize);
    this.reproductibilityMapView = new ReproductibilityMapView(this.cellSize);
    this.seedRangeMapView = new SeedRangeMapView(this.cellSize);
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
    this.seedRangeMapDirty = this.seedRangeMapEnabled;
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

    if (
      this.seedRangeMapEnabled &&
      this.seedRangeMapDirty &&
      this.seedRangePlayerId
    ) {
      this.seedRangeMapView.sync(
        this.model.createSeedRangeMapSnapshot(this.seedRangePlayerId),
      );
      this.seedRangeMapDirty = false;
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
      this.seedRangeMapDirty ||
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

  setSeedRangeMapEnabled(enabled: boolean): void {
    this.seedRangeMapEnabled = enabled;
    this.seedRangeMapView.visible = enabled;

    if (enabled) {
      this.seedRangeMapDirty = true;
      return;
    }

    this.seedRangeMapView.clear();
    this.seedRangeMapDirty = false;
  }

  setSeedRangePlayer(playerId: PlayerId): void {
    if (!playerId.trim() || this.seedRangePlayerId === playerId) {
      return;
    }

    this.seedRangePlayerId = playerId;
    this.seedRangeMapDirty = this.seedRangeMapEnabled;
  }

  setTeamColorsEnabled(enabled: boolean): void {
    if (this.teamColorsEnabled === enabled) {
      return;
    }

    this.teamColorsEnabled = enabled;
    this.queueFullSnapshot();
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

  getTileSnapshot(x: number, y: number): Readonly<TileSnapshot> | null {
    return this.model?.getTile(x, y)?.toSnapshot() ?? null;
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

  canPlacePlaceable(placeable: Placeable, playerId: PlayerId): boolean {
    return (
      this.model?.canSeedCells(
        placeable.getWorldCells(),
        placeable.getEssence(),
        playerId,
        placeable.getBehaviors(),
      ) ?? false
    );
  }

  placePlaceable(placeable: Placeable, playerId: PlayerId): boolean {
    if (!this.model || !this.canPlacePlaceable(placeable, playerId)) {
      return false;
    }

    const changes = this.model.seedCells(
      placeable.getWorldCells(),
      placeable.getEssence(),
      playerId,
      placeable.getBehaviors(),
      placeable.getRotation(),
    );
    this.queueDelta(changes);
    this.tileInfoDirty = this.lastHoveredTile !== null;
    this.reproductibilityMapDirty = this.reproductibilityMapEnabled;
    this.seedRangeMapDirty = this.seedRangeMapEnabled;
    return true;
  }

  clearMap(): void {
    if (!this.model) {
      return;
    }

    const changes = this.model.clearLivingCells();
    this.queueDelta(changes);
    this.tileInfoDirty = this.lastHoveredTile !== null;
    this.reproductibilityMapDirty = this.reproductibilityMapEnabled;
    this.seedRangeMapDirty = this.seedRangeMapEnabled;
  }

  destroy(): void {
    window.removeEventListener("resize", this.onResize);
    this.unbindMapPointerEvents();
    this.eventManager.destroy();
    this.chunkRenderDebugView.destroy();
    this.reproductibilityMapView.destroy();
    this.seedRangeMapView.destroy();

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
      this.model = new MapModel(gridWidth, gridHeight, this.teamResolver);
      this.mapView = new MapView(this.cellSize);
      this.mapView
        .getOverlayLayer()
        .addChild(
          this.reproductibilityMapView,
          this.seedRangeMapView,
          this.chunkRenderDebugView,
        );
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
      snapshot: this.model.createRenderSnapshot(
        this.cellSize,
        this.resolvePlayerColor,
      ),
    };
    this.pendingDelta = null;
    this.renderDirty = true;
    this.reproductibilityMapDirty = this.reproductibilityMapEnabled;
    this.seedRangeMapDirty = this.seedRangeMapEnabled;
  }

  private queueDelta(changeSet: CellChangeSet): void {
    if (!this.model || changeSet.changes.length === 0) {
      return;
    }

    const nextDelta: MapRenderDelta = {
      revision: this.model.getRenderRevision(),
      changedCells: this.model.cellChangesToVisualStates(
        changeSet,
        this.resolvePlayerColor,
      ),
    };

    this.pendingDelta = mergeRenderDeltas(this.pendingDelta, nextDelta);
    this.pendingUpdate = { kind: "delta", delta: this.pendingDelta };
    this.renderDirty = true;
  }

  private readonly resolvePlayerColor = (playerId: PlayerId): number | null => {
    if (!this.teamColorsEnabled) {
      return null;
    }

    return this.teamResolver?.getPlayerTeam(playerId)?.color ?? null;
  };
}

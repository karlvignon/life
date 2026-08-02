import { Application, Container, Rectangle } from "pixi.js";
import type { EventBus } from "../../core/EventBus";
import type { GameEventMap } from "../../core/types/gameEvents";
import { Builder } from "./Builder";
import { GameOfLifeEssence } from "./GameOfLifeEssence";
import { GenesisSpaceship } from "./GenesisSpaceship";
import { MapEventManager } from "./MapEventManager";
import { MapModel } from "./MapModel";
import { MapView } from "./MapView";
import { Placeable } from "./Placeable";
import { Spaceship } from "./Spaceship";
import { TileInfoUi } from "./TileInfoUi";
import { computeGridSize, DEFAULT_CELL_SIZE, type MapConfig } from "./types";

export type {
  MapConfig,
  TileSnapshot,
  TileInfoUiLayoutConfig,
  CellOffset,
} from "./types";
export { Tile } from "./Tile";
export { DEFAULT_TILE_INFO_UI_LAYOUT } from "./types";
export type { Essence } from "./Essence";
export {
  GameOfLifeEssence,
  DEFAULT_GAME_OF_LIFE_COLOR,
} from "./GameOfLifeEssence";
export { HighLifeEssence, DEFAULT_HIGHLIFE_COLOR } from "./HighLifeEssence";
export { StaticEssence, DEFAULT_STATIC_COLOR } from "./StaticEssence";
export { Pattern } from "./Pattern";
export { RlePattern } from "./RlePattern";
export { Spaceship } from "./Spaceship";
export { GenesisSpaceship } from "./GenesisSpaceship";
export { GliderSpaceship } from "./GliderSpaceship";
export { LightweightSpaceship } from "./LightweightSpaceship";
export { MiddleweightSpaceship } from "./MiddleweightSpaceship";
export { Placeable } from "./Placeable";
export { HighLifeReplicator } from "./patterns/HighLifeReplicator";
export { Tree } from "./patterns/Tree";

export class MapManager {
  private readonly app: Application;
  private readonly stage: Container;
  private readonly uiRoot: Container;
  private readonly cellSize: number;
  private readonly initialSpaceship: Spaceship;
  private readonly builder = new Builder();
  private readonly eventManager = new MapEventManager();

  private model: MapModel | null = null;
  private mapView: MapView | null = null;
  private readonly tileInfoUi: TileInfoUi;
  private readonly gameEventBus: EventBus | null;
  private seeded = false;
  private stepsPerSecond = 0;
  private evolutionAccumulatorMs = 0;

  private readonly onResize = (): void => {
    this.layout();
  };

  constructor(
    app: Application,
    config: MapConfig = {},
    gameEventBus: EventBus | null = null,
  ) {
    this.app = app;
    this.stage = app.stage;
    this.gameEventBus = gameEventBus;
    this.cellSize = config.cellSize ?? DEFAULT_CELL_SIZE;
    const defaultEssence = config.defaultEssence ?? new GameOfLifeEssence();
    this.initialSpaceship =
      config.initialSpaceship ?? new GenesisSpaceship(defaultEssence);

    this.uiRoot = new Container();
    this.uiRoot.label = "uiRoot";
    this.stage.addChild(this.uiRoot);

    this.tileInfoUi = new TileInfoUi(config.tileInfoLayout);
    this.uiRoot.addChild(this.tileInfoUi);

    this.bindEvents();

    this.layout();
    requestAnimationFrame(() => {
      this.layout();
    });
    window.addEventListener("resize", this.onResize);
  }

  update(dtMs: number): void {
    if (!this.model || this.stepsPerSecond <= 0) {
      return;
    }

    const stepIntervalMs = 1000 / this.stepsPerSecond;
    this.evolutionAccumulatorMs += dtMs;

    while (this.evolutionAccumulatorMs >= stepIntervalMs) {
      this.model.step();
      this.evolutionAccumulatorMs -= stepIntervalMs;
    }
  }

  render(): void {
    this.mapView?.syncFromModel();
  }

  getModel(): MapModel | null {
    return this.model;
  }

  getMapView(): MapView | null {
    return this.mapView;
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

    this.builder.place(this.model, placeable);
  }

  clearMap(): void {
    this.model?.clearLivingCells();
  }

  destroy(): void {
    window.removeEventListener("resize", this.onResize);
    this.eventManager.destroy();

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

  private layout(): void {
    const { gridWidth, gridHeight } = computeGridSize(
      this.app.screen.width,
      this.app.screen.height,
      this.cellSize,
    );

    if (!this.model) {
      this.model = new MapModel(gridWidth, gridHeight);
      this.mapView = new MapView(this.model, this.eventManager, this.cellSize);
      this.stage.addChild(this.mapView);
    } else {
      this.model.resize(gridWidth, gridHeight);
      this.mapView?.rebuild();
    }

    this.applyInitialCells();
    this.centerMap();
    this.layoutUiRoot();
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
    this.builder.build(this.model, placeable);

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
}

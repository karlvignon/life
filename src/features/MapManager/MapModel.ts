import { packIndex } from "../../core/types/grid";
import type { WeatherSnapshot } from "../../core/types/weather";
import type { Essence } from "./model/essences/Essence";
import {
  emptyChangeSet,
  mergeChangeSets,
  type CellChange,
  type CellChangeSet,
} from "./model/CellChangeSet";
import { computeNextGeneration } from "./model/evolution/EvolutionEngine";
import { LivingCellRegistry } from "./model/LivingCellRegistry";
import { Tile } from "./model/Tile";
import { applyModifiers, Modifier } from "./model/modifiers/Modifier";
import type { TileSnapshot } from "./types";
import {
  deadCellVisualState,
  livingCellVisualState,
  type CellVisualState,
  type MapRenderSnapshot,
} from "./render/types";

export class MapModel {
  private _gridWidth: number;
  private _gridHeight: number;
  private tiles: Tile[][] = [];
  private readonly registry = new LivingCellRegistry();
  private readonly modifierTargetsByEssence = new Map<
    Essence,
    Map<string, Tile[]>
  >();
  private renderRevision = 0;

  constructor(gridWidth: number, gridHeight: number) {
    this._gridWidth = gridWidth;
    this._gridHeight = gridHeight;
    this.initGrid();
  }

  get gridWidth(): number {
    return this._gridWidth;
  }

  get gridHeight(): number {
    return this._gridHeight;
  }

  getRenderRevision(): number {
    return this.renderRevision;
  }

  getLivingCount(): number {
    return this.registry.size;
  }

  getTile(x: number, y: number): Tile | null {
    if (!this.isInBounds(x, y)) {
      return null;
    }

    return this.tiles[y][x];
  }

  getLivingCells(): Tile[] {
    const living: Tile[] = [];

    this.registry.forEach((_index, _essence, x, y) => {
      const tile = this.getTile(x, y);
      if (tile?.isAlive()) {
        living.push(tile);
      }
    }, this._gridWidth);

    return living;
  }

  getLivingSnapshots(): TileSnapshot[] {
    const snapshots: TileSnapshot[] = [];

    this.registry.forEach((_index, _essence, x, y) => {
      const tile = this.getTile(x, y);
      if (tile?.isAlive()) {
        snapshots.push(tile.toSnapshot());
      }
    }, this._gridWidth);

    return snapshots;
  }

  setCellAlive(x: number, y: number, essence: Essence): CellChangeSet {
    const tile = this.getTile(x, y);
    if (!tile) {
      return emptyChangeSet();
    }

    const index = packIndex(x, y, this._gridWidth);
    const wasAlive = tile.isAlive();
    const previousEssence = tile.getEssence();

    if (wasAlive && previousEssence && previousEssence !== essence) {
      this.removeModifiersAuthoredBy(x, y, previousEssence);
    }

    tile.setAlive(true, essence);
    this.registry.set(index, essence);

    if (!wasAlive || previousEssence !== essence) {
      this.applyBirthModifiers(x, y, essence);
    }
    this.renderRevision++;

    if (wasAlive && previousEssence === essence) {
      return emptyChangeSet();
    }

    return {
      changes: [
        {
          x,
          y,
          alive: true,
          essence,
        },
      ],
    };
  }

  placeCells(
    cells: ReadonlyArray<{ x: number; y: number }>,
    essence: Essence,
  ): CellChangeSet {
    const changes: CellChange[] = [];

    for (const { x, y } of cells) {
      const tile = this.getTile(x, y);
      if (!tile) {
        continue;
      }

      const index = packIndex(x, y, this._gridWidth);
      const wasAlive = tile.isAlive();
      const previousEssence = tile.getEssence();

      if (wasAlive && previousEssence && previousEssence !== essence) {
        this.removeModifiersAuthoredBy(x, y, previousEssence);
      }

      tile.setAlive(true, essence);
      this.registry.set(index, essence);

      if (!wasAlive || previousEssence !== essence) {
        this.applyBirthModifiers(x, y, essence);
        changes.push({ x, y, alive: true, essence });
      }
    }

    if (changes.length > 0) {
      this.renderRevision++;
    }

    return { changes };
  }

  clearLivingCells(): CellChangeSet {
    const changes: CellChange[] = [];

    this.registry.forEach((_index, _essence, x, y) => {
      const tile = this.getTile(x, y);
      const essence = tile?.getEssence();
      if (essence) {
        this.removeModifiersAuthoredBy(x, y, essence);
      }
      tile?.setAlive(false);
      changes.push({ x, y, alive: false, essence: null });
    }, this._gridWidth);

    this.registry.clear();

    if (changes.length > 0) {
      this.renderRevision++;
    }

    return { changes };
  }

  setLivingCells(cells: TileSnapshot[]): CellChangeSet {
    const clearChanges = this.clearLivingCells();
    const placeChanges: CellChange[] = [];

    for (const cell of cells) {
      if (!cell.alive || !cell.essence || !cell.data) {
        continue;
      }

      const tile = this.getTile(cell.x, cell.y);
      if (!tile) {
        continue;
      }

      const index = packIndex(cell.x, cell.y, this._gridWidth);
      tile.setAlive(true, cell.essence, cell.data);
      this.registry.set(index, cell.essence);
      this.applyBirthModifiers(cell.x, cell.y, cell.essence);
      placeChanges.push({
        x: cell.x,
        y: cell.y,
        alive: true,
        essence: cell.essence,
      });
    }

    if (placeChanges.length > 0) {
      this.renderRevision++;
    }

    return {
      changes: [...clearChanges.changes, ...placeChanges],
    };
  }

  step(
    currentCycle: number,
    weather: Readonly<WeatherSnapshot>,
  ): CellChangeSet {
    if (!Number.isSafeInteger(currentCycle) || currentCycle < 1) {
      throw new RangeError("currentCycle must be a positive safe integer");
    }
    if (weather.cycle !== currentCycle) {
      throw new RangeError("weather cycle must match currentCycle");
    }

    const living = this.registry.snapshot();

    if (living.length === 0) {
      return emptyChangeSet();
    }

    const { nextLiving } = computeNextGeneration({
      bounds: { width: this._gridWidth, height: this._gridHeight },
      living,
      currentCycle,
      essenceOrder: this.registry.getEssenceOrder(),
    });

    const evolutionChanges = this.registry.applyNextLiving(
      nextLiving,
      this._gridWidth,
    );

    for (const change of evolutionChanges) {
      const tile = this.getTile(change.x, change.y);
      if (!tile) {
        continue;
      }

      if (change.previousAlive && change.previousEssence) {
        this.removeModifiersAuthoredBy(
          change.x,
          change.y,
          change.previousEssence,
        );
      }

      if (change.nextAlive && change.nextEssence) {
        tile.setAlive(true, change.nextEssence);
        this.applyBirthModifiers(change.x, change.y, change.nextEssence);
      } else {
        tile.setAlive(false);
      }
    }

    // Phase 2 : chaque cellule applique indépendamment les répercussions météo,
    // après que toutes les naissances et morts d'évolution ont été appliquées.
    this.registry.forEach((_index, essence, x, y) => {
      const tile = this.getTile(x, y);
      if (!tile) {
        return;
      }

      tile.apply(
        essence.getWeatherRepercussion(
          applyModifiers(weather, tile.getModifiers()),
        ),
      );
    }, this._gridWidth);

    const survivingLiving = new Map(
      this.registry
        .snapshot()
        .filter(({ index }) => {
          const x = index % this._gridWidth;
          const y = Math.floor(index / this._gridWidth);
          return this.getTile(x, y)?.getData()?.hasPositiveLife() ?? false;
        })
        .map(({ index, essence }) => [index, essence] as const),
    );
    const weatherDeathChanges = this.registry.applyNextLiving(
      survivingLiving,
      this._gridWidth,
    );

    for (const change of weatherDeathChanges) {
      if (change.previousEssence) {
        this.removeModifiersAuthoredBy(
          change.x,
          change.y,
          change.previousEssence,
        );
      }
      this.getTile(change.x, change.y)?.setAlive(false);
    }

    const changeSet = mergeChangeSets(
      {
        changes: evolutionChanges.map((change) => ({
          x: change.x,
          y: change.y,
          alive: change.nextAlive,
          essence: change.nextEssence,
        })),
      },
      {
        changes: weatherDeathChanges.map((change) => ({
          x: change.x,
          y: change.y,
          alive: false,
          essence: null,
        })),
      },
    );

    if (changeSet.changes.length > 0) {
      this.renderRevision++;
    }

    return changeSet;
  }

  createRenderSnapshot(cellSize: number): MapRenderSnapshot {
    const livingCells: CellVisualState[] = [];

    this.registry.forEach((_index, essence, x, y) => {
      livingCells.push(livingCellVisualState(x, y, essence));
    }, this._gridWidth);

    return {
      revision: this.renderRevision,
      gridWidth: this._gridWidth,
      gridHeight: this._gridHeight,
      cellSize,
      livingCells,
    };
  }

  cellChangesToVisualStates(changeSet: CellChangeSet): CellVisualState[] {
    return changeSet.changes.map((change) =>
      change.alive && change.essence
        ? livingCellVisualState(change.x, change.y, change.essence)
        : deadCellVisualState(change.x, change.y),
    );
  }

  resize(gridWidth: number, gridHeight: number): MapRenderSnapshot | null {
    if (gridWidth === this._gridWidth && gridHeight === this._gridHeight) {
      return null;
    }

    const previousLiving = this.getLivingSnapshots();

    this._gridWidth = gridWidth;
    this._gridHeight = gridHeight;
    this.initGrid();
    this.registry.clear();
    this.modifierTargetsByEssence.clear();

    for (const snapshot of previousLiving) {
      const tile = this.getTile(snapshot.x, snapshot.y);
      if (tile && snapshot.essence && snapshot.data) {
        const index = packIndex(snapshot.x, snapshot.y, this._gridWidth);
        tile.setAlive(true, snapshot.essence, snapshot.data);
        this.registry.set(index, snapshot.essence);
      }
    }

    this.registry.forEach((_index, essence, x, y) => {
      this.applyBirthModifiers(x, y, essence);
    }, this._gridWidth);

    this.renderRevision++;

    return this.createRenderSnapshot(0);
  }

  private initGrid(): void {
    this.tiles = [];

    for (let y = 0; y < this._gridHeight; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < this._gridWidth; x++) {
        row.push(new Tile(x, y, false));
      }
      this.tiles.push(row);
    }
  }

  private applyBirthModifiers(x: number, y: number, essence: Essence): void {
    const definitions = essence.getBirthModifiers();
    if (definitions.length === 0) {
      return;
    }

    const author = Object.freeze({ x, y, essence });
    const targets: Tile[] = [];

    for (const definition of definitions) {
      const target = this.getTile(
        x + definition.offsetX,
        y + definition.offsetY,
      );
      if (!target) {
        continue;
      }

      target.addModifier(
        new Modifier(
          author,
          definition.property,
          definition.mode,
          definition.value,
        ),
      );
      targets.push(target);
    }

    if (targets.length === 0) {
      return;
    }

    let targetsByAuthor = this.modifierTargetsByEssence.get(essence);
    if (!targetsByAuthor) {
      targetsByAuthor = new Map<string, Tile[]>();
      this.modifierTargetsByEssence.set(essence, targetsByAuthor);
    }
    targetsByAuthor.set(this.getModifierAuthorKey(x, y), targets);
  }

  private removeModifiersAuthoredBy(
    x: number,
    y: number,
    essence: Essence,
  ): void {
    const targetsByAuthor = this.modifierTargetsByEssence.get(essence);
    if (!targetsByAuthor) {
      return;
    }

    const authorKey = this.getModifierAuthorKey(x, y);
    const targets = targetsByAuthor.get(authorKey);
    if (!targets) {
      return;
    }

    const author = { x, y, essence };
    for (const target of targets) {
      target.removeModifiersAuthoredBy(author);
    }

    targetsByAuthor.delete(authorKey);
    if (targetsByAuthor.size === 0) {
      this.modifierTargetsByEssence.delete(essence);
    }
  }

  private getModifierAuthorKey(x: number, y: number): string {
    return `${x}:${y}`;
  }

  private isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this._gridWidth && y >= 0 && y < this._gridHeight;
  }
}

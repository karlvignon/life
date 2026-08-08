import { packIndex } from "../../core/types/grid";
import type { WeatherSnapshot } from "../../core/types/weather";
import type { PlayerId } from "../../core/types/player";
import type { TeamId, TeamResolver } from "../../core/types/team";
import type { Essence } from "./model/essences/Essence";
import {
  BLIND_SEEDING_BEHAVIOR_ID,
  BlindSeeding,
} from "./model/behaviors/BlindSeeding";
import { SEED_RANGE_BEHAVIOR_ID, SeedRange } from "./model/behaviors/SeedRange";
import type { TileBehavior } from "./model/behaviors/TileBehavior";
import {
  BehaviorInheritanceModel,
  type BehaviorInheritance,
} from "./model/behaviors/BehaviorInheritanceModel";
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
import type { TileProvenance, TileSnapshot } from "./types";
import type { PlaceableRotation } from "./model/Placeable";
import {
  deadCellVisualState,
  livingCellVisualState,
  type CellVisualState,
  type MapRenderSnapshot,
  type ReproductibilityCellVisualState,
  type ReproductibilityMapSnapshot,
  type SeedRangeMapSnapshot,
} from "./render/types";

export interface MapModelConfig {
  readonly teamResolver?: TeamResolver;
  readonly behaviorInheritance?: BehaviorInheritance;
}

export class MapModel {
  private _gridWidth: number;
  private _gridHeight: number;
  private tiles: Tile[][] = [];
  private readonly registry = new LivingCellRegistry();
  private readonly modifierTargetsByEssence = new Map<
    Essence,
    Map<string, Tile[]>
  >();
  private readonly teamResolver?: TeamResolver;
  private readonly behaviorInheritance: BehaviorInheritance;
  private renderRevision = 0;

  constructor(
    gridWidth: number,
    gridHeight: number,
    config: MapModelConfig = {},
  ) {
    this._gridWidth = gridWidth;
    this._gridHeight = gridHeight;
    this.teamResolver = config.teamResolver;
    this.behaviorInheritance =
      config.behaviorInheritance ?? new BehaviorInheritanceModel();
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

  setCellAlive(
    x: number,
    y: number,
    essence: Essence,
    provenance: TileProvenance,
    behaviors: ReadonlyArray<TileBehavior> = [],
    rotation: PlaceableRotation = 0,
  ): CellChangeSet {
    const tile = this.getTile(x, y);
    if (!tile) {
      return emptyChangeSet();
    }

    const index = packIndex(x, y, this._gridWidth);
    const wasAlive = tile.isAlive();
    const previousEssence = tile.getEssence();
    const previousPlayerId = tile.getProvenance()?.playerId;

    if (wasAlive && previousEssence && previousEssence !== essence) {
      this.removeModifiersAuthoredBy(x, y, previousEssence);
    }

    tile.makeAlive({ essence, provenance, behaviors, rotation });
    this.registry.set(index, essence);

    const visualStateChanged =
      !wasAlive ||
      previousEssence !== essence ||
      previousPlayerId !== provenance.playerId;

    if (!wasAlive || previousEssence !== essence) {
      this.applyBirthModifiers(x, y, essence);
    }

    if (!visualStateChanged) {
      return emptyChangeSet();
    }

    this.renderRevision++;

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
    provenance: TileProvenance,
    behaviors: ReadonlyArray<TileBehavior> = [],
    rotation: PlaceableRotation = 0,
  ): CellChangeSet {
    if (!this.canPlaceCells(cells, essence)) {
      return emptyChangeSet();
    }

    const changes: CellChange[] = [];

    for (const { x, y } of cells) {
      const tile = this.getTile(x, y);
      if (!tile) {
        continue;
      }

      const index = packIndex(x, y, this._gridWidth);
      const wasAlive = tile.isAlive();
      const previousEssence = tile.getEssence();
      const previousPlayerId = tile.getProvenance()?.playerId;

      if (wasAlive && previousEssence && previousEssence !== essence) {
        this.removeModifiersAuthoredBy(x, y, previousEssence);
      }

      tile.makeAlive({ essence, provenance, behaviors, rotation });
      this.registry.set(index, essence);

      const visualStateChanged =
        !wasAlive ||
        previousEssence !== essence ||
        previousPlayerId !== provenance.playerId;

      if (!wasAlive || previousEssence !== essence) {
        this.applyBirthModifiers(x, y, essence);
      }
      if (visualStateChanged) {
        changes.push({ x, y, alive: true, essence });
      }
    }

    if (changes.length > 0) {
      this.renderRevision++;
    }

    return { changes };
  }

  canPlaceCells(
    cells: ReadonlyArray<{ x: number; y: number }>,
    essence: Essence,
  ): boolean {
    if (cells.length === 0) {
      return false;
    }

    return cells.every(({ x, y }) => {
      const tile = this.getTile(x, y);
      return (
        tile !== null && (!tile.isAlive() || tile.getEssence() === essence)
      );
    });
  }

  canSeedCells(
    cells: ReadonlyArray<{ x: number; y: number }>,
    essence: Essence,
    playerId: PlayerId,
    behaviors: ReadonlyArray<TileBehavior> = [],
  ): boolean {
    if (!playerId.trim() || !this.canPlaceCells(cells, essence)) {
      return false;
    }

    if (hasBlindSeeding(behaviors)) {
      return true;
    }

    const coveredIndices = this.collectTeamSeedRangeIndices(
      this.resolveTeamId(playerId),
    );
    return cells.every(({ x, y }) =>
      coveredIndices.has(packIndex(x, y, this._gridWidth)),
    );
  }

  seedCells(
    cells: ReadonlyArray<{ x: number; y: number }>,
    essence: Essence,
    playerId: PlayerId,
    behaviors: ReadonlyArray<TileBehavior> = [],
    rotation: PlaceableRotation = 0,
  ): CellChangeSet {
    if (!this.canSeedCells(cells, essence, playerId, behaviors)) {
      return emptyChangeSet();
    }

    return this.placeCells(
      cells,
      essence,
      {
        kind: "player-placement",
        playerId,
      },
      behaviors,
      rotation,
    );
  }

  clearLivingCells(): CellChangeSet {
    const changes: CellChange[] = [];

    this.registry.forEach((_index, _essence, x, y) => {
      const tile = this.getTile(x, y);
      const essence = tile?.getEssence();
      if (essence) {
        this.removeModifiersAuthoredBy(x, y, essence);
      }
      tile?.kill();
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

      if (!cell.provenance) {
        throw new Error("A living tile snapshot must have a provenance");
      }

      const tile = this.getTile(cell.x, cell.y);
      if (!tile) {
        continue;
      }

      const index = packIndex(cell.x, cell.y, this._gridWidth);
      tile.makeAlive({
        essence: cell.essence,
        properties: cell.data,
        provenance: cell.provenance,
        behaviors: cell.behaviors,
        rotation: cell.rotation,
      });
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

    const living = this.registry.snapshot().map(({ index, essence }) => {
      const x = index % this._gridWidth;
      const y = Math.floor(index / this._gridWidth);
      const tile = this.getTile(x, y);
      const reproducibility = tile?.getData()?.getReproducibility();
      const provenance = tile?.getProvenance();

      if (reproducibility === undefined) {
        throw new Error(`Living cell ${index} has no reproducibility data`);
      }
      if (!provenance) {
        throw new Error(`Living cell ${index} has no provenance`);
      }

      return {
        index,
        essence,
        reproducibility,
        playerId: provenance.playerId,
        teamId: this.resolveTeamId(provenance.playerId),
        rotation: tile?.getRotation() ?? 0,
      };
    });

    if (living.length === 0) {
      return emptyChangeSet();
    }

    const {
      nextLiving,
      reproductionCosts,
      newbornReproducibility,
      newbornPlayerIds,
      newbornParentContributions,
      newbornRotations,
    } = computeNextGeneration({
      bounds: { width: this._gridWidth, height: this._gridHeight },
      living,
      currentCycle,
      essenceOrder: this.registry.getEssenceOrder(),
    });

    for (const [index, cost] of reproductionCosts) {
      const x = index % this._gridWidth;
      const y = Math.floor(index / this._gridWidth);
      this.getTile(x, y)?.apply({ reproducibility: -cost });
    }

    const evolutionChanges = this.registry.applyNextLiving(
      nextLiving,
      this._gridWidth,
    );

    // Les naissances sont matérialisées avant les morts afin que le modèle
    // d'héritage reçoive encore toutes les cellules parentes vivantes.
    for (const change of evolutionChanges) {
      if (change.previousAlive || !change.nextAlive || !change.nextEssence) {
        continue;
      }

      const tile = this.getTile(change.x, change.y);
      if (!tile) {
        continue;
      }

      const inheritedReproducibility = newbornReproducibility.get(change.index);
      const properties =
        inheritedReproducibility === undefined
          ? undefined
          : {
              ...change.nextEssence.getInitialProperties(),
              reproducibility: inheritedReproducibility,
            };
      const playerId = newbornPlayerIds.get(change.index);
      if (!playerId) {
        throw new Error(`Newborn cell ${change.index} has no owning player`);
      }
      const parentContributions = newbornParentContributions.get(change.index);
      if (!parentContributions) {
        throw new Error(`Newborn cell ${change.index} has no parent payments`);
      }

      tile.makeAlive({
        essence: change.nextEssence,
        properties,
        provenance: { kind: "simulation-birth", playerId },
        rotation: newbornRotations.get(change.index) ?? 0,
      });
      this.behaviorInheritance.inheritBehaviors(
        tile,
        parentContributions.map(({ index, paidPoints }) => {
          const parentX = index % this._gridWidth;
          const parentY = Math.floor(index / this._gridWidth);
          const parentCell = this.getTile(parentX, parentY);
          if (!parentCell?.isAlive()) {
            throw new Error(`Behavior parent cell ${index} is not alive`);
          }

          return { cell: parentCell, paidPoints };
        }),
      );
      this.applyBirthModifiers(change.x, change.y, change.nextEssence);
    }

    for (const change of evolutionChanges) {
      if (!change.previousAlive || !change.previousEssence) {
        continue;
      }

      if (change.nextAlive) {
        throw new Error(
          `Evolution cannot replace living cell ${change.index} with another essence`,
        );
      }

      this.removeModifiersAuthoredBy(
        change.x,
        change.y,
        change.previousEssence,
      );
      this.getTile(change.x, change.y)?.kill();
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
      this.getTile(change.x, change.y)?.kill();
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

  createRenderSnapshot(
    cellSize: number,
    resolvePlayerColor?: (playerId: PlayerId) => number | null,
  ): MapRenderSnapshot {
    const livingCells: CellVisualState[] = [];

    this.registry.forEach((_index, essence, x, y) => {
      livingCells.push(
        livingCellVisualState(
          x,
          y,
          essence,
          this.resolveLivingCellColor(x, y, essence, resolvePlayerColor),
        ),
      );
    }, this._gridWidth);

    return {
      revision: this.renderRevision,
      gridWidth: this._gridWidth,
      gridHeight: this._gridHeight,
      cellSize,
      livingCells,
    };
  }

  createReproductibilityMapSnapshot(): ReproductibilityMapSnapshot {
    const livingCells: ReproductibilityCellVisualState[] = [];

    this.registry.forEach((_index, _essence, x, y) => {
      const score = this.getTile(x, y)?.getData()?.getReproducibility();
      if (score === undefined) {
        return;
      }

      livingCells.push({ x, y, score });
    }, this._gridWidth);

    return { livingCells };
  }

  createSeedRangeMapSnapshot(playerId: PlayerId): SeedRangeMapSnapshot {
    const team = this.teamResolver?.getPlayerTeam(playerId) ?? null;
    const teamId = team?.id ?? playerId;
    const coveredCells = [...this.collectTeamSeedRangeIndices(teamId)]
      .filter((index) => !this.registry.has(index))
      .map((index) => ({
        x: index % this._gridWidth,
        y: Math.floor(index / this._gridWidth),
      }));

    return { coveredCells };
  }

  cellChangesToVisualStates(
    changeSet: CellChangeSet,
    resolvePlayerColor?: (playerId: PlayerId) => number | null,
  ): CellVisualState[] {
    return changeSet.changes.map((change) =>
      change.alive && change.essence
        ? livingCellVisualState(
            change.x,
            change.y,
            change.essence,
            this.resolveLivingCellColor(
              change.x,
              change.y,
              change.essence,
              resolvePlayerColor,
            ),
          )
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
        if (!snapshot.provenance) {
          throw new Error("A living tile snapshot must have a provenance");
        }
        tile.makeAlive({
          essence: snapshot.essence,
          properties: snapshot.data,
          provenance: snapshot.provenance,
          behaviors: snapshot.behaviors,
          rotation: snapshot.rotation,
        });
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
        row.push(new Tile(x, y));
      }
      this.tiles.push(row);
    }
  }

  private resolveLivingCellColor(
    x: number,
    y: number,
    essence: Essence,
    resolvePlayerColor?: (playerId: PlayerId) => number | null,
  ): number {
    const provenance = this.getTile(x, y)?.getProvenance();
    if (!provenance) {
      throw new Error(`Living cell (${x},${y}) has no provenance`);
    }

    return resolvePlayerColor?.(provenance.playerId) ?? essence.color;
  }

  private resolveTeamId(playerId: PlayerId): TeamId {
    return this.teamResolver?.getPlayerTeam(playerId)?.id ?? playerId;
  }

  private collectTeamSeedRangeIndices(teamId: TeamId): Set<number> {
    const coveredIndices = new Set<number>();

    this.registry.forEach((_index, _essence, x, y) => {
      const tile = this.getTile(x, y);
      const provenance = tile?.getProvenance();
      if (
        !tile ||
        !provenance ||
        this.resolveTeamId(provenance.playerId) !== teamId
      ) {
        return;
      }

      const seedRange = tile.getBehavior<SeedRange>(SEED_RANGE_BEHAVIOR_ID);
      if (!seedRange) {
        return;
      }
      for (
        let offsetY = -seedRange.value;
        offsetY <= seedRange.value;
        offsetY++
      ) {
        for (
          let offsetX = -seedRange.value;
          offsetX <= seedRange.value;
          offsetX++
        ) {
          const coveredX = x + offsetX;
          const coveredY = y + offsetY;
          if (
            this.isInBounds(coveredX, coveredY) &&
            seedRange.containsOffset(offsetX, offsetY)
          ) {
            coveredIndices.add(packIndex(coveredX, coveredY, this._gridWidth));
          }
        }
      }
    }, this._gridWidth);

    return coveredIndices;
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

function hasBlindSeeding(behaviors: ReadonlyArray<TileBehavior>): boolean {
  return behaviors.some(
    (behavior) =>
      behavior.id === BLIND_SEEDING_BEHAVIOR_ID &&
      behavior instanceof BlindSeeding,
  );
}

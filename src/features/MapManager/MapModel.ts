import { packIndex } from "../../core/types/grid";
import type { WeatherSnapshot } from "../../core/types/weather";
import type { PlayerId } from "../../core/types/player";
import type { TeamId, TeamResolver } from "../../core/types/team";
import type { Essence } from "./model/essences/Essence";
import { essenceCatalog } from "./model/essences/EssenceCatalog";
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
import { ModifierRegistry } from "./model/modifiers/ModifierRegistry";
import { LifecycleHookRunner } from "./model/lifecycle/LifecycleHookRunner";
import type {
  BirthCause,
  DeathCause,
  HookTileSnapshot,
  MapQuery,
  SourcedMapEffect,
} from "./model/lifecycle/types";
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
  readonly essenceResolver?: (essenceId: string) => Essence;
}

export class MapModel {
  private _gridWidth: number;
  private _gridHeight: number;
  private tiles: Tile[][] = [];
  private readonly registry = new LivingCellRegistry();
  private readonly modifierRegistry = new ModifierRegistry();
  private readonly lifecycleHookRunner = new LifecycleHookRunner();
  private readonly effectQueue: SourcedMapEffect[] = [];
  private readonly teamResolver?: TeamResolver;
  private readonly behaviorInheritance: BehaviorInheritance;
  private readonly essenceResolver: (essenceId: string) => Essence;
  private currentCycle = 0;
  private nextLifeSequence = 0;
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
    this.essenceResolver =
      config.essenceResolver ?? ((essenceId) => essenceCatalog.get(essenceId));
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

  getModifiers(x: number, y: number): ReadonlyArray<Modifier> {
    return this.modifierRegistry.getAt(x, y);
  }

  getLivingCells(): Tile[] {
    return this.registry.snapshot().flatMap(({ index }) => {
      const x = index % this._gridWidth;
      const y = Math.floor(index / this._gridWidth);
      const tile = this.getTile(x, y);
      return tile?.isAlive() ? [tile] : [];
    });
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

    let hookChanges = emptyChangeSet();
    if (wasAlive && previousEssence && previousEssence !== essence) {
      this.transitionToDeath(tile, "replacement");
    }

    tile.makeAlive({
      essence,
      provenance,
      behaviors,
      rotation,
      lifeId:
        !wasAlive || previousEssence !== essence
          ? this.createLifeId()
          : undefined,
    });
    this.registry.set(index, essence);

    const visualStateChanged =
      !wasAlive ||
      previousEssence !== essence ||
      previousPlayerId !== provenance.playerId;

    if (!wasAlive || previousEssence !== essence) {
      this.enqueueBirthHooks(
        tile,
        provenance.kind === "player-placement"
          ? "player-placement"
          : "simulation",
      );
      hookChanges = this.drainEffectQueue();
    }

    if (!visualStateChanged) {
      return hookChanges;
    }

    this.renderRevision++;

    return mergeChangeSets(
      {
        changes: [{ x, y, alive: true, essence }],
      },
      hookChanges,
    );
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
    const newborns: Array<{ tile: Tile; cause: BirthCause }> = [];

    for (const { x, y } of cells) {
      const tile = this.getTile(x, y);
      if (!tile) {
        continue;
      }

      const index = packIndex(x, y, this._gridWidth);
      const wasAlive = tile.isAlive();
      const previousEssence = tile.getEssence();
      const previousPlayerId = tile.getProvenance()?.playerId;

      tile.makeAlive({
        essence,
        provenance,
        behaviors,
        rotation,
        lifeId:
          !wasAlive || previousEssence !== essence
            ? this.createLifeId()
            : undefined,
      });
      this.registry.set(index, essence);

      const visualStateChanged =
        !wasAlive ||
        previousEssence !== essence ||
        previousPlayerId !== provenance.playerId;

      if (!wasAlive || previousEssence !== essence) {
        newborns.push({
          tile,
          cause:
            provenance.kind === "player-placement"
              ? "player-placement"
              : "simulation",
        });
      }
      if (visualStateChanged) {
        changes.push({ x, y, alive: true, essence });
      }
    }

    for (const { tile: newborn, cause } of newborns) {
      this.enqueueBirthHooks(newborn, cause);
    }
    const hookChanges = this.drainEffectQueue();

    if (changes.length > 0 || hookChanges.changes.length > 0) {
      this.renderRevision++;
    }

    return mergeChangeSets({ changes }, hookChanges);
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
      const lifeId = tile?.getLifeId();
      if (lifeId) {
        this.modifierRegistry.removeSource(lifeId);
      }
      tile?.kill();
      changes.push({ x, y, alive: false, essence: null });
    }, this._gridWidth);

    this.registry.clear();
    this.effectQueue.length = 0;
    this.modifierRegistry.clear();

    if (changes.length > 0) {
      this.renderRevision++;
    }

    return { changes };
  }

  setLivingCells(cells: TileSnapshot[]): CellChangeSet {
    const restoredLifeIds = new Set<string>();
    for (const cell of cells) {
      if (!cell.alive || !cell.lifeId) {
        continue;
      }
      if (restoredLifeIds.has(cell.lifeId)) {
        throw new RangeError(`Duplicate tile life id: ${cell.lifeId}`);
      }
      restoredLifeIds.add(cell.lifeId);
    }

    const clearChanges = this.clearLivingCells();
    this.modifierRegistry.clear();
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
        lifeId: cell.lifeId ?? this.createLifeId(),
      });
      this.observeLifeId(cell.lifeId);
      this.registry.set(index, cell.essence);
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

    this.currentCycle = currentCycle;
    this.modifierRegistry.expireBeforeCycle(currentCycle);

    // Le snapshot de début de cycle empêche les naissances causées par un hook
    // de recevoir onCycle avant le cycle suivant.
    const cycleStartTiles = this.getLivingCells();
    for (const tile of cycleStartTiles) {
      this.enqueueCycleHooks(tile, weather);
    }
    let lifecycleChanges = this.drainEffectQueue();

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
      if (lifecycleChanges.changes.length > 0) {
        this.renderRevision++;
      }
      return lifecycleChanges;
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
        lifeId: this.createLifeId(),
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
      this.enqueueBirthHooks(tile, "simulation");
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

      const tile = this.getTile(change.x, change.y);
      if (tile) {
        this.transitionToDeath(tile, "evolution");
      }
    }

    lifecycleChanges = mergeChangeSets(
      lifecycleChanges,
      this.drainEffectQueue(),
    );

    // Phase 2 : chaque cellule applique indépendamment les répercussions météo,
    // après que toutes les naissances et morts d'évolution ont été appliquées.
    this.registry.forEach((_index, essence, x, y) => {
      const tile = this.getTile(x, y);
      if (!tile) {
        return;
      }

      tile.apply(
        essence.getWeatherRepercussion(
          applyModifiers(weather, this.getModifiers(x, y)),
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
      const tile = this.getTile(change.x, change.y);
      if (tile) {
        this.transitionToDeath(tile, "weather");
      }
    }

    lifecycleChanges = mergeChangeSets(
      lifecycleChanges,
      this.drainEffectQueue(),
    );

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
    const completeChangeSet = mergeChangeSets(changeSet, lifecycleChanges);

    if (completeChangeSet.changes.length > 0) {
      this.renderRevision++;
    }

    return completeChangeSet;
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

    for (const snapshot of previousLiving) {
      if (
        snapshot.lifeId &&
        (snapshot.x < 0 ||
          snapshot.x >= gridWidth ||
          snapshot.y < 0 ||
          snapshot.y >= gridHeight)
      ) {
        this.modifierRegistry.removeSource(snapshot.lifeId);
      }
    }

    this._gridWidth = gridWidth;
    this._gridHeight = gridHeight;
    this.initGrid();
    this.registry.clear();

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
          lifeId: snapshot.lifeId ?? undefined,
        });
        this.registry.set(index, snapshot.essence);
      }
    }

    this.modifierRegistry.pruneTargets((x, y) => this.isInBounds(x, y));

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

  private enqueueBirthHooks(tile: Tile, cause: BirthCause): void {
    const snapshot = this.createHookSnapshot(tile);
    const essence = tile.getEssence();
    if (!snapshot || !essence) {
      return;
    }
    this.effectQueue.push(
      ...this.lifecycleHookRunner.run(
        "birth",
        essence,
        this.getLifecycleBehaviors(tile, essence),
        {
          cycle: this.currentCycle,
          cause,
          self: snapshot,
          map: this.createMapQuery(),
        },
      ),
    );
  }

  private enqueueCycleHooks(
    tile: Tile,
    weather: Readonly<WeatherSnapshot>,
  ): void {
    const snapshot = this.createHookSnapshot(tile);
    const essence = tile.getEssence();
    if (!snapshot || !essence) {
      return;
    }
    this.effectQueue.push(
      ...this.lifecycleHookRunner.run(
        "cycle",
        essence,
        this.getLifecycleBehaviors(tile, essence),
        {
          cycle: this.currentCycle,
          weather,
          self: snapshot,
          map: this.createMapQuery(),
        },
      ),
    );
  }

  private enqueueDeathHooks(tile: Tile, cause: DeathCause): void {
    const snapshot = this.createHookSnapshot(tile);
    const essence = tile.getEssence();
    if (!snapshot || !essence) {
      return;
    }
    this.effectQueue.push(
      ...this.lifecycleHookRunner.run(
        "death",
        essence,
        this.getLifecycleBehaviors(tile, essence),
        {
          cycle: this.currentCycle,
          cause,
          self: snapshot,
          map: this.createMapQuery(),
        },
      ),
    );
  }

  private getLifecycleBehaviors(
    tile: Tile,
    essence: Essence,
  ): ReadonlyArray<TileBehavior> {
    const behaviors = [
      ...essence.getLifecycleBehaviors(),
      ...tile.getBehaviors(),
    ];
    const ids = new Set<string>();
    for (const behavior of behaviors) {
      if (ids.has(behavior.id)) {
        throw new RangeError(
          `Duplicate lifecycle behavior on tile (${tile.x},${tile.y}): ${behavior.id}`,
        );
      }
      ids.add(behavior.id);
    }
    return behaviors;
  }

  private transitionToDeath(tile: Tile, cause: DeathCause): void {
    if (!tile.isAlive()) {
      return;
    }
    const lifeId = tile.getLifeId();
    this.enqueueDeathHooks(tile, cause);
    if (lifeId) {
      this.modifierRegistry.removeSource(lifeId);
    }
    this.registry.delete(packIndex(tile.x, tile.y, this._gridWidth));
    tile.kill();
  }

  private drainEffectQueue(): CellChangeSet {
    const changes: CellChange[] = [];
    let processed = 0;
    const maximumEffects = Math.max(
      1_000,
      this._gridWidth * this._gridHeight * 20,
    );

    while (this.effectQueue.length > 0) {
      if (++processed > maximumEffects) {
        this.effectQueue.length = 0;
        throw new Error("lifecycle effect cascade exceeded its safety budget");
      }
      const sourcedEffect = this.effectQueue.shift()!;
      const change = this.resolveEffect(sourcedEffect);
      if (change) {
        changes.push(change);
      }
    }

    return { changes };
  }

  private resolveEffect({
    source,
    effect,
  }: SourcedMapEffect): CellChange | null {
    const target = this.getTile(effect.target.x, effect.target.y);
    if (!target) {
      return null;
    }

    switch (effect.type) {
      case "spawn-essence": {
        if (target.isAlive()) {
          if ((effect.collision ?? "if-empty") === "if-empty") {
            return null;
          }
          this.transitionToDeath(target, "replacement");
        }

        const essence = this.essenceResolver(effect.essenceId);
        target.makeAlive({
          essence,
          provenance: { kind: "simulation-birth", playerId: source.playerId },
          lifeId: this.createLifeId(),
        });
        this.registry.set(
          packIndex(target.x, target.y, this._gridWidth),
          essence,
        );
        this.enqueueBirthHooks(target, "hook");
        return { x: target.x, y: target.y, alive: true, essence };
      }
      case "damage": {
        if (!Number.isFinite(effect.amount) || effect.amount < 0) {
          throw new RangeError("damage amount must be non-negative and finite");
        }
        if (!target.isAlive()) {
          return null;
        }
        target.apply({ life: -effect.amount });
        if (target.getData()?.hasPositiveLife()) {
          return null;
        }
        this.transitionToDeath(target, "damage");
        return {
          x: target.x,
          y: target.y,
          alive: false,
          essence: null,
        };
      }
      case "heal": {
        if (!Number.isFinite(effect.amount) || effect.amount < 0) {
          throw new RangeError("heal amount must be non-negative and finite");
        }
        const data = target.getData();
        if (!data) {
          return null;
        }
        target.apply({
          life: Math.min(effect.amount, data.getMaximumLife() - data.getLife()),
        });
        return null;
      }
      case "tile-data:add":
        if (!Number.isFinite(effect.value)) {
          throw new RangeError("tile data effect value must be finite");
        }
        target.apply({ [effect.property]: effect.value });
        return null;
      case "modifier:add": {
        const lifetime = effect.lifetime ?? { type: "while-source-alive" };
        if (
          lifetime.type === "while-source-alive" &&
          !this.isLifeAlive(source.lifeId)
        ) {
          return null;
        }
        this.modifierRegistry.add(
          target.x,
          target.y,
          new Modifier(
            {
              x: source.x,
              y: source.y,
              essence: source.essence,
              lifeId: source.lifeId,
              behaviorId: source.behaviorId,
              phase: source.phase,
            },
            effect.modifier.property,
            effect.modifier.mode,
            effect.modifier.value,
            { key: effect.key, lifetime },
          ),
          this.currentCycle,
        );
        return null;
      }
      case "modifier:remove":
        this.modifierRegistry.remove(
          target.x,
          target.y,
          effect.key,
          (effect.source ?? "self") === "self" ? source.lifeId : undefined,
        );
        return null;
    }
  }

  private isLifeAlive(lifeId: string): boolean {
    return this.getLivingCells().some((tile) => tile.getLifeId() === lifeId);
  }

  private createMapQuery(): MapQuery {
    return Object.freeze({
      bounds: Object.freeze({
        width: this._gridWidth,
        height: this._gridHeight,
      }),
      getTile: (x: number, y: number) =>
        this.createHookSnapshot(this.getTile(x, y)),
      getLivingTiles: () =>
        this.getLivingCells()
          .map((tile) => this.createHookSnapshot(tile))
          .filter((snapshot) => snapshot !== null),
    });
  }

  private createHookSnapshot(tile: Tile | null): HookTileSnapshot | null {
    const essence = tile?.getEssence();
    const data = tile?.getData();
    const provenance = tile?.getProvenance();
    const lifeId = tile?.getLifeId();
    if (!tile || !essence || !data || !provenance || !lifeId) {
      return null;
    }

    return Object.freeze({
      index: packIndex(tile.x, tile.y, this._gridWidth),
      x: tile.x,
      y: tile.y,
      lifeId,
      essenceId: essence.id,
      data: Object.freeze(data.toProperties()),
      provenance,
      rotation: tile.getRotation(),
      behaviorIds: Object.freeze(
        [...essence.getLifecycleBehaviors(), ...tile.getBehaviors()].map(
          ({ id }) => id,
        ),
      ),
    });
  }

  private createLifeId(): string {
    return `life:${++this.nextLifeSequence}`;
  }

  private observeLifeId(lifeId: string | null): void {
    if (!lifeId?.startsWith("life:")) {
      return;
    }
    const sequence = Number(lifeId.slice("life:".length));
    if (Number.isSafeInteger(sequence) && sequence > this.nextLifeSequence) {
      this.nextLifeSequence = sequence;
    }
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

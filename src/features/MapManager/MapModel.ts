import type { Essence } from "./model/essences/Essence";
import { Tile } from "./model/Tile";
import type { CellOffset } from "../../core/types/grid";
import type { TileSnapshot } from "./types";

function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

interface EssenceGeneration {
  essence: Essence;
  inputCells: ReadonlySet<string>;
  aliveCells: ReadonlyArray<CellOffset>;
}

export class MapModel {
  private _gridWidth: number;
  private _gridHeight: number;
  private tiles: Tile[][] = [];
  private currentCycle = 0;

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

  getCurrentCycle(): number {
    return this.currentCycle;
  }

  getTile(x: number, y: number): Tile | null {
    if (!this.isInBounds(x, y)) {
      return null;
    }

    return this.tiles[y][x];
  }

  getLivingCells(): Tile[] {
    const living: Tile[] = [];

    for (let y = 0; y < this._gridHeight; y++) {
      for (let x = 0; x < this._gridWidth; x++) {
        const tile = this.tiles[y][x];
        if (tile.isAlive()) {
          living.push(tile);
        }
      }
    }

    return living;
  }

  clearLivingCells(): void {
    for (let y = 0; y < this._gridHeight; y++) {
      for (let x = 0; x < this._gridWidth; x++) {
        this.tiles[y][x].setAlive(false);
      }
    }
  }

  setLivingCells(cells: TileSnapshot[]): void {
    this.clearLivingCells();

    for (const cell of cells) {
      const tile = this.getTile(cell.x, cell.y);
      if (tile && cell.alive && cell.essence) {
        tile.setAlive(true, cell.essence);
      }
    }
  }

  step(): void {
    this.currentCycle++;

    const livingCells = this.getLivingCells();
    const groups = this.groupByEssence(livingCells);
    const nextGenerations: EssenceGeneration[] = [];

    for (const [essence, tiles] of groups) {
      const inputCells = new Set(tiles.map((tile) => cellKey(tile.x, tile.y)));
      const otherEssenceCells = livingCells
        .filter((tile) => tile.getEssence() !== essence)
        .map((tile) => ({ x: tile.x, y: tile.y }));

      const result = essence.evolve({
        gridWidth: this._gridWidth,
        gridHeight: this._gridHeight,
        aliveCells: tiles.map((tile) => ({ x: tile.x, y: tile.y })),
        currentCycle: this.currentCycle,
        otherEssenceCells,
      });

      nextGenerations.push({
        essence,
        inputCells,
        aliveCells: result.aliveCells,
      });
    }

    const merged = this.mergeGenerations(livingCells, nextGenerations);

    this.clearLivingCells();

    for (const [key, essence] of merged) {
      const [x, y] = key.split(",").map(Number);
      const tile = this.getTile(x, y);
      if (tile) {
        tile.setAlive(true, essence);
      }
    }
  }

  resize(gridWidth: number, gridHeight: number): void {
    if (gridWidth === this._gridWidth && gridHeight === this._gridHeight) {
      return;
    }

    const previousLiving = this.getLivingCells().map((tile) =>
      tile.toSnapshot(),
    );

    this._gridWidth = gridWidth;
    this._gridHeight = gridHeight;
    this.initGrid();

    this.setLivingCells(previousLiving);
  }

  private mergeGenerations(
    livingCells: Tile[],
    nextGenerations: EssenceGeneration[],
  ): Map<string, Essence> {
    const merged = new Map<string, Essence>();

    for (const tile of livingCells) {
      const essence = tile.getEssence();
      if (!essence) {
        continue;
      }

      const generation = nextGenerations.find(
        (entry) => entry.essence === essence,
      );
      if (!generation) {
        continue;
      }

      const key = cellKey(tile.x, tile.y);
      const survives = generation.aliveCells.some(
        (cell) => cellKey(cell.x, cell.y) === key,
      );

      if (survives) {
        merged.set(key, essence);
      }
    }

    for (const generation of nextGenerations) {
      for (const { x, y } of generation.aliveCells) {
        const key = cellKey(x, y);
        if (merged.has(key)) {
          continue;
        }

        if (generation.inputCells.has(key)) {
          continue;
        }

        merged.set(key, generation.essence);
      }
    }

    return merged;
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

  private groupByEssence(tiles: Tile[]): Map<Essence, Tile[]> {
    const groups = new Map<Essence, Tile[]>();

    for (const tile of tiles) {
      const essence = tile.getEssence();
      if (!essence) {
        continue;
      }

      const group = groups.get(essence) ?? [];
      group.push(tile);
      groups.set(essence, group);
    }

    return groups;
  }

  private isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this._gridWidth && y >= 0 && y < this._gridHeight;
  }
}

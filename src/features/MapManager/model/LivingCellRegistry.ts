import type { CellIndex } from "../../../core/types/grid";
import { unpackIndex } from "../../../core/types/grid";
import type { Essence } from "./essences/Essence";
import type { LivingCellReference } from "./evolution/types";

export class LivingCellRegistry {
  private readonly cells = new Map<CellIndex, Essence>();
  private readonly essenceOrder: Essence[] = [];
  private readonly essenceSeen = new Set<Essence>();

  get size(): number {
    return this.cells.size;
  }

  has(index: CellIndex): boolean {
    return this.cells.has(index);
  }

  getEssence(index: CellIndex): Essence | undefined {
    return this.cells.get(index);
  }

  set(index: CellIndex, essence: Essence): void {
    this.cells.set(index, essence);
    this.trackEssenceOrder(essence);
  }

  delete(index: CellIndex): void {
    this.cells.delete(index);
  }

  clear(): void {
    this.cells.clear();
    this.essenceOrder.length = 0;
    this.essenceSeen.clear();
  }

  snapshot(): LivingCellReference[] {
    const entries: LivingCellReference[] = [];

    const sortedIndices = [...this.cells.keys()].sort((a, b) => a - b);

    for (const index of sortedIndices) {
      const essence = this.cells.get(index);
      if (essence) {
        entries.push({ index, essence });
      }
    }

    return entries;
  }

  getEssenceOrder(): readonly Essence[] {
    return this.essenceOrder;
  }

  getLivingIndices(): ReadonlySet<CellIndex> {
    return new Set(this.cells.keys());
  }

  forEach(
    visitor: (index: CellIndex, essence: Essence, x: number, y: number) => void,
    width: number,
  ): void {
    for (const [index, essence] of this.cells) {
      const { x, y } = unpackIndex(index, width);
      visitor(index, essence, x, y);
    }
  }

  applyNextLiving(
    nextLiving: ReadonlyMap<CellIndex, Essence>,
    width: number,
  ): Array<{
    index: CellIndex;
    x: number;
    y: number;
    previousAlive: boolean;
    previousEssence: Essence | null;
    nextAlive: boolean;
    nextEssence: Essence | null;
  }> {
    const changes: Array<{
      index: CellIndex;
      x: number;
      y: number;
      previousAlive: boolean;
      previousEssence: Essence | null;
      nextAlive: boolean;
      nextEssence: Essence | null;
    }> = [];

    const touched = new Set<CellIndex>();

    for (const [index, essence] of this.cells) {
      touched.add(index);
      const nextEssence = nextLiving.get(index) ?? null;
      const { x, y } = unpackIndex(index, width);

      if (!nextEssence) {
        changes.push({
          index,
          x,
          y,
          previousAlive: true,
          previousEssence: essence,
          nextAlive: false,
          nextEssence: null,
        });
      } else if (nextEssence !== essence) {
        changes.push({
          index,
          x,
          y,
          previousAlive: true,
          previousEssence: essence,
          nextAlive: true,
          nextEssence,
        });
      }
    }

    for (const [index, essence] of nextLiving) {
      if (this.cells.has(index)) {
        continue;
      }

      touched.add(index);
      const { x, y } = unpackIndex(index, width);
      changes.push({
        index,
        x,
        y,
        previousAlive: false,
        previousEssence: null,
        nextAlive: true,
        nextEssence: essence,
      });
    }

    this.cells.clear();
    this.essenceOrder.length = 0;
    this.essenceSeen.clear();

    for (const [index, essence] of nextLiving) {
      this.set(index, essence);
    }

    return changes;
  }

  rebuildFromSnapshots(
    snapshots: ReadonlyArray<{
      x: number;
      y: number;
      alive: boolean;
      essence: Essence | null;
    }>,
    width: number,
  ): void {
    this.clear();

    for (const snapshot of snapshots) {
      if (snapshot.alive && snapshot.essence) {
        const index = snapshot.y * width + snapshot.x;
        this.set(index, snapshot.essence);
      }
    }
  }

  private trackEssenceOrder(essence: Essence): void {
    if (this.essenceSeen.has(essence)) {
      return;
    }

    this.essenceSeen.add(essence);
    this.essenceOrder.push(essence);
  }
}

import { chunkKey, type ChunkCoord } from "./render/chunkIndex";

export const DEFAULT_CHUNK_RENDER_FLASH_DURATION_MS = 300;

export interface ChunkRenderMarker extends ChunkCoord {
  readonly opacity: number;
}

interface ChunkRenderFlash extends ChunkCoord {
  remainingMs: number;
}

export class ChunkRenderDebugModel {
  private readonly flashes = new Map<string, ChunkRenderFlash>();

  constructor(
    private readonly flashDurationMs = DEFAULT_CHUNK_RENDER_FLASH_DURATION_MS,
  ) {}

  flash(chunks: ReadonlyArray<ChunkCoord>): void {
    for (const chunk of chunks) {
      this.flashes.set(chunkKey(chunk.cx, chunk.cy), {
        ...chunk,
        remainingMs: this.flashDurationMs,
      });
    }
  }

  update(dtMs: number): boolean {
    if (!Number.isFinite(dtMs) || dtMs <= 0 || this.flashes.size === 0) {
      return false;
    }

    for (const [key, flash] of this.flashes) {
      flash.remainingMs -= dtMs;

      if (flash.remainingMs <= 0) {
        this.flashes.delete(key);
      }
    }

    return true;
  }

  getMarkers(): ReadonlyArray<ChunkRenderMarker> {
    return [...this.flashes.values()].map(({ cx, cy, remainingMs }) => ({
      cx,
      cy,
      opacity: Math.min(1, Math.max(0, remainingMs / this.flashDurationMs)),
    }));
  }

  clear(): void {
    this.flashes.clear();
  }
}

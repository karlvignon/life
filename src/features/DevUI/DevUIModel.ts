export class DevUIModel {
  private fps = 0;
  private readonly renderTimesMs: number[] = [];
  private renderTimeTotalMs = 0;

  constructor(private readonly renderSampleCount = 60) {}

  setFps(fps: number): void {
    this.fps = Number.isFinite(fps) ? Math.max(0, Math.round(fps)) : 0;
  }

  getFps(): number {
    return this.fps;
  }

  addRenderTime(renderTimeMs: number): void {
    if (!Number.isFinite(renderTimeMs) || renderTimeMs < 0) {
      return;
    }

    this.renderTimesMs.push(renderTimeMs);
    this.renderTimeTotalMs += renderTimeMs;

    if (this.renderTimesMs.length > this.renderSampleCount) {
      const removedRenderTime = this.renderTimesMs.shift();

      if (removedRenderTime !== undefined) {
        this.renderTimeTotalMs -= removedRenderTime;
      }
    }
  }

  getAverageRenderTimeMs(): number {
    if (this.renderTimesMs.length === 0) {
      return 0;
    }

    return this.renderTimeTotalMs / this.renderTimesMs.length;
  }
}

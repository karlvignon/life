import type { WeatherValues } from "../../core/types/weather";
import {
  MAX_OVERRIDE_DEGREES,
  MAX_OVERRIDE_WIND_STRENGTH,
  MIN_OVERRIDE_DEGREES,
  MIN_OVERRIDE_WIND_STRENGTH,
} from "./types";

export class DevUIModel {
  private fps = 0;
  private readonly renderTimesMs: number[] = [];
  private renderTimeTotalMs = 0;
  private weatherOverrideEnabled = false;
  private windStrength = MIN_OVERRIDE_WIND_STRENGTH;
  private degrees = 0;

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

  syncWeather(snapshot: WeatherValues): void {
    if (this.weatherOverrideEnabled) {
      return;
    }

    this.windStrength = clamp(
      snapshot.windStrength,
      MIN_OVERRIDE_WIND_STRENGTH,
      MAX_OVERRIDE_WIND_STRENGTH,
    );
    this.degrees = clamp(
      snapshot.degrees,
      MIN_OVERRIDE_DEGREES,
      MAX_OVERRIDE_DEGREES,
    );
  }

  setWeatherOverrideEnabled(enabled: boolean): void {
    this.weatherOverrideEnabled = enabled;
  }

  isWeatherOverrideEnabled(): boolean {
    return this.weatherOverrideEnabled;
  }

  setWindStrength(windStrength: number): void {
    this.windStrength = clamp(
      windStrength,
      MIN_OVERRIDE_WIND_STRENGTH,
      MAX_OVERRIDE_WIND_STRENGTH,
    );
  }

  getWindStrength(): number {
    return this.windStrength;
  }

  getNormalizedWindStrength(): number {
    return normalize(
      this.windStrength,
      MIN_OVERRIDE_WIND_STRENGTH,
      MAX_OVERRIDE_WIND_STRENGTH,
    );
  }

  setDegrees(degrees: number): void {
    this.degrees = clamp(degrees, MIN_OVERRIDE_DEGREES, MAX_OVERRIDE_DEGREES);
  }

  getDegrees(): number {
    return this.degrees;
  }

  getNormalizedDegrees(): number {
    return normalize(this.degrees, MIN_OVERRIDE_DEGREES, MAX_OVERRIDE_DEGREES);
  }
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function normalize(value: number, min: number, max: number): number {
  return (value - min) / (max - min);
}

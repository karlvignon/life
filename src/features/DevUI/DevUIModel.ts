import type { GameSpeedSnapshot } from "../../core/types/gameEvents";
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
  private cardStaminaCostsDisabled = false;
  private reproductibilityMapEnabled = false;
  private teamColorsEnabled = false;
  private minSpeed = 0;
  private maxSpeed = 10;
  private speed = 1;
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

  setCardStaminaCostsDisabled(disabled: boolean): void {
    this.cardStaminaCostsDisabled = disabled;
  }

  areCardStaminaCostsDisabled(): boolean {
    return this.cardStaminaCostsDisabled;
  }

  setReproductibilityMapEnabled(enabled: boolean): void {
    this.reproductibilityMapEnabled = enabled;
  }

  isReproductibilityMapEnabled(): boolean {
    return this.reproductibilityMapEnabled;
  }

  setTeamColorsEnabled(enabled: boolean): void {
    this.teamColorsEnabled = enabled;
  }

  areTeamColorsEnabled(): boolean {
    return this.teamColorsEnabled;
  }

  syncSpeed(snapshot: Readonly<GameSpeedSnapshot>): void {
    this.minSpeed = snapshot.minSpeed;
    this.maxSpeed = Math.max(snapshot.minSpeed, snapshot.maxSpeed);
    this.speed = clamp(snapshot.speed, this.minSpeed, this.maxSpeed);
  }

  setSpeedFromNormalized(normalized: number): void {
    this.speed = denormalize(normalized, this.minSpeed, this.maxSpeed);
  }

  getSpeed(): number {
    return this.speed;
  }

  getNormalizedSpeed(): number {
    return normalize(this.speed, this.minSpeed, this.maxSpeed);
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
  if (max === min) {
    return 0;
  }

  return (value - min) / (max - min);
}

function denormalize(normalized: number, min: number, max: number): number {
  return min + clamp(normalized, 0, 1) * (max - min);
}

import { DEFAULT_MAX_SPEED, DEFAULT_MIN_SPEED, DEFAULT_SPEED } from "./types";

export class GameOptionsModel {
  private readonly minSpeed: number;
  private readonly maxSpeed: number;
  private speed: number;

  constructor(
    minSpeed = DEFAULT_MIN_SPEED,
    maxSpeed = DEFAULT_MAX_SPEED,
    initialSpeed = DEFAULT_SPEED,
  ) {
    this.minSpeed = minSpeed;
    this.maxSpeed = maxSpeed;
    this.speed = this.clamp(initialSpeed);
  }

  getMinSpeed(): number {
    return this.minSpeed;
  }

  getMaxSpeed(): number {
    return this.maxSpeed;
  }

  getSpeed(): number {
    return this.speed;
  }

  setSpeed(speed: number): void {
    this.speed = this.clamp(speed);
  }

  getNormalizedSpeed(): number {
    if (this.maxSpeed === this.minSpeed) {
      return 0;
    }

    return (this.speed - this.minSpeed) / (this.maxSpeed - this.minSpeed);
  }

  setSpeedFromNormalized(normalized: number): void {
    const clamped = Math.min(1, Math.max(0, normalized));
    this.speed = this.minSpeed + clamped * (this.maxSpeed - this.minSpeed);
  }

  private clamp(speed: number): number {
    return Math.min(this.maxSpeed, Math.max(this.minSpeed, speed));
  }
}

export interface TileDataProperties {
  readonly life: number;
  readonly maximumLife: number;
  readonly reproducibility: number;
}

export type TileDataDelta = Partial<TileDataProperties>;

/** Données effectives et propres à une tuile vivante. */
export class TileData {
  private life: number;
  private maximumLife: number;
  private reproducibility: number;

  constructor(input: TileDataProperties) {
    validateProperties(input);
    this.life = input.life;
    this.maximumLife = input.maximumLife;
    this.reproducibility = input.reproducibility;
  }

  getLife(): number {
    return this.life;
  }

  getMaximumLife(): number {
    return this.maximumLife;
  }

  getReproducibility(): number {
    return this.reproducibility;
  }

  hasPositiveLife(): boolean {
    return this.life > 0;
  }

  apply(delta: Readonly<TileDataDelta>): void {
    const nextProperties = {
      life: this.life + (delta.life ?? 0),
      maximumLife: this.maximumLife + (delta.maximumLife ?? 0),
      reproducibility: this.reproducibility + (delta.reproducibility ?? 0),
    };
    validateProperties(nextProperties);
    this.life = nextProperties.life;
    this.maximumLife = nextProperties.maximumLife;
    this.reproducibility = nextProperties.reproducibility;
  }

  toProperties(): TileDataProperties {
    return {
      life: this.life,
      maximumLife: this.maximumLife,
      reproducibility: this.reproducibility,
    };
  }
}

function validateProperties(input: TileDataProperties): void {
  validateFinite(input.life, "life");
  validateFinite(input.maximumLife, "maximumLife");
  validateFinite(input.reproducibility, "reproducibility");

  if (input.maximumLife < 0) {
    throw new RangeError("maximumLife must be non-negative");
  }
}

function validateFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} must be finite`);
  }
}

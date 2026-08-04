import {
  DEFAULT_MAXIMUM_STAMINA,
  type PlayerConfig,
  type StaminaSnapshot,
} from "./types";

/** État métier du joueur, indépendant de PixiJS. */
export class Player {
  private stamina: number;
  private readonly maximumStamina: number;

  constructor(config: PlayerConfig = {}) {
    this.maximumStamina = config.maximumStamina ?? DEFAULT_MAXIMUM_STAMINA;

    if (!Number.isFinite(this.maximumStamina) || this.maximumStamina <= 0) {
      throw new RangeError("maximumStamina must be a finite positive number");
    }

    const initialStamina = config.initialStamina ?? this.maximumStamina;
    if (!Number.isFinite(initialStamina) || initialStamina < 0) {
      throw new RangeError(
        "initialStamina must be a finite positive or zero number",
      );
    }

    this.stamina = Math.min(initialStamina, this.maximumStamina);
  }

  getStamina(): number {
    return this.stamina;
  }

  getMaximumStamina(): number {
    return this.maximumStamina;
  }

  getStaminaSnapshot(): Readonly<StaminaSnapshot> {
    return {
      current: this.stamina,
      maximum: this.maximumStamina,
    };
  }

  canSpendStamina(cost: number): boolean {
    validateAmount(cost, "stamina cost");
    return this.stamina >= cost;
  }

  trySpendStamina(cost: number): boolean {
    if (!this.canSpendStamina(cost)) {
      return false;
    }

    this.stamina -= cost;
    return true;
  }

  recoverStamina(amount: number): void {
    validateAmount(amount, "stamina recovery");
    this.stamina = Math.min(this.maximumStamina, this.stamina + amount);
  }
}

function validateAmount(amount: number, label: string): void {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError(`${label} must be a finite positive or zero number`);
  }
}

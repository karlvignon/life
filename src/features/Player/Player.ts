import {
  DEFAULT_MAXIMUM_STAMINA,
  DEFAULT_PLAYER_ID,
  type PlayerConfig,
  type StaminaSnapshot,
} from "./types";
import type { PlayerId } from "../../core/types/player";

/** État métier du joueur, indépendant de PixiJS. */
export class Player {
  private readonly id: PlayerId;
  private readonly label: string;
  private stamina: number;
  private readonly maximumStamina: number;

  constructor(config: PlayerConfig = {}) {
    this.id = config.id ?? DEFAULT_PLAYER_ID;
    if (!this.id.trim()) {
      throw new RangeError("player id must not be empty");
    }
    this.label = config.label ?? this.id;
    if (!this.label.trim()) {
      throw new RangeError("player label must not be empty");
    }

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

  getId(): PlayerId {
    return this.id;
  }

  getLabel(): string {
    return this.label;
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

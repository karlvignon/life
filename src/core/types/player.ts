export type PlayerId = string;

export interface StaminaConsumer {
  trySpendStamina(cost: number): boolean;
}

export interface PlacementActor extends StaminaConsumer {
  getPlayerId(): PlayerId;
}

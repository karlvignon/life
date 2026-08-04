export interface StaminaConsumer {
  trySpendStamina(cost: number): boolean;
}

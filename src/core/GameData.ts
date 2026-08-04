export interface GameDataConfig {
  staminaRecoveryPerSecond?: number;
}

export const DEFAULT_STAMINA_RECOVERY_PER_SECOND = 10;

/** Données d'équilibrage partagées par les features du jeu. */
export class GameData {
  readonly staminaRecoveryPerSecond: number;

  constructor(config: GameDataConfig = {}) {
    const staminaRecoveryPerSecond =
      config.staminaRecoveryPerSecond ?? DEFAULT_STAMINA_RECOVERY_PER_SECOND;

    if (
      !Number.isFinite(staminaRecoveryPerSecond) ||
      staminaRecoveryPerSecond < 0
    ) {
      throw new RangeError(
        "staminaRecoveryPerSecond must be a finite positive or zero number",
      );
    }

    this.staminaRecoveryPerSecond = staminaRecoveryPerSecond;
  }
}

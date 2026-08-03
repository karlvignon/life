import type { CellIndex, GridBounds } from "../../../../core/types/grid";
import type { WeatherSnapshot } from "../../../../core/types/weather";

export interface EssenceEvolutionInput {
  bounds: GridBounds;
  /** Cell indices alive in this essence group. */
  aliveIndices: ReadonlySet<CellIndex>;
  /** Numéro du cycle courant (1-based, incrémenté à chaque step). */
  currentCycle: number;
  /** All living cell indices on the grid (all essences). */
  globalLivingIndices: ReadonlySet<CellIndex>;
}

export interface EssenceEvolutionResult {
  aliveIndices: ReadonlyArray<CellIndex>;
}

export interface EssencePropertiesDelta {
  readonly life: number;
}

export interface EssenceProperties {
  readonly life: number;
}

/**
 * Définition immuable et contrat pur d'une essence.
 *
 * L'état propre à chaque cellule vit dans Tile, jamais dans cette définition.
 */
export abstract class Essence {
  protected initialLife = 100;

  abstract readonly color: number;
  readonly name: string = "Essence";

  getInitialProperties(): EssenceProperties {
    return { life: this.initialLife };
  }

  /**
   * Calcule les variations de propriétés causées par la météo.
   * Le Model applique ce delta après l'évolution de toutes les cellules.
   */
  getWeatherRepercussion(
    weather: Readonly<WeatherSnapshot>,
  ): EssencePropertiesDelta {
    void weather;
    return { life: 0 };
  }

  abstract evolve(input: EssenceEvolutionInput): EssenceEvolutionResult;
}

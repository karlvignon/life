import type { CellIndex, GridBounds } from "../../../../core/types/grid";
import type { EssenceId } from "../../../../core/types/cards";
import type { WeatherSnapshot } from "../../../../core/types/weather";
import {
  TileData,
  type TileDataDelta,
  type TileDataProperties,
} from "../TileData";
import type { ModifierDefinition } from "../modifiers/Modifier";

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

export type EssencePropertiesDelta = TileDataDelta;
export type EssenceProperties = TileDataProperties;

export interface BirthModifierDefinition extends ModifierDefinition {
  readonly offsetX: number;
  readonly offsetY: number;
}

/**
 * Définition immuable et contrat pur d'une essence.
 *
 * L'état propre à chaque cellule vit dans le TileData détenu par Tile,
 * jamais dans cette définition.
 */
export abstract class Essence {
  protected readonly defaultTileData: TileDataProperties = {
    life: 100,
    maximumLife: 100,
  };

  abstract readonly color: number;
  abstract readonly id: EssenceId;
  readonly name: string = "Essence";

  getInitialProperties(): EssenceProperties {
    return { ...this.defaultTileData };
  }

  createTileData(): TileData {
    return new TileData(this.defaultTileData);
  }

  /** Modifiers créés une seule fois lors de la naissance d'une cellule. */
  getBirthModifiers(): ReadonlyArray<BirthModifierDefinition> {
    return [];
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

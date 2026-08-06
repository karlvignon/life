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
  readonly bounds: GridBounds;
  /** Cellules alliées de la même famille, utilisées par les règles de voisinage. */
  readonly aliveIndices: ReadonlySet<CellIndex>;
  /** Cellules portant exactement l'essence dont les comportements sont évalués. */
  readonly essenceIndices: ReadonlySet<CellIndex>;
  readonly currentCycle: number;
  readonly globalLivingIndices: ReadonlySet<CellIndex>;
}

export interface EssenceBirth {
  readonly index: CellIndex;
  readonly parentIndices: ReadonlyArray<CellIndex>;
}

export interface EvolutionProposal {
  readonly births?: ReadonlyArray<EssenceBirth>;
  readonly deaths?: ReadonlyArray<CellIndex>;
}

export interface EvolutionBehavior {
  readonly id: string;
  evaluate(input: EssenceEvolutionInput): EvolutionProposal;
}

export interface WeatherBehavior {
  readonly id: string;
  evaluate(weather: Readonly<WeatherSnapshot>): EssencePropertiesDelta;
}

export interface EssenceEvolutionResult {
  readonly aliveIndices: ReadonlyArray<CellIndex>;
  readonly births?: ReadonlyArray<EssenceBirth>;
}

export type EssencePropertiesDelta = TileDataDelta;
export type EssenceProperties = TileDataProperties;

export interface BirthModifierDefinition extends ModifierDefinition {
  readonly offsetX: number;
  readonly offsetY: number;
}

export interface EssenceDefinition {
  readonly id: EssenceId;
  /** Groupe de cellules compatibles pour les règles d'évolution. */
  readonly evolutionFamilyId?: string;
  /** Priorité entre essences d'une même famille ; la plus petite passe avant. */
  readonly evolutionPriority?: number;
  readonly name: string;
  readonly color: number;
  readonly initialProperties?: Readonly<TileDataProperties>;
  readonly reproductionCost?: number;
  readonly evolutionBehaviors?: ReadonlyArray<EvolutionBehavior>;
  readonly weatherBehaviors?: ReadonlyArray<WeatherBehavior>;
  readonly birthModifiers?: ReadonlyArray<BirthModifierDefinition>;
}

const DEFAULT_PROPERTIES: TileDataProperties = Object.freeze({
  life: 100,
  maximumLife: 100,
  reproducibility: 10,
});

/** Définition immuable d'une essence composée de comportements purs. */
export class Essence {
  readonly id: EssenceId;
  readonly evolutionFamilyId: string;
  readonly evolutionPriority: number;
  readonly name: string;
  readonly color: number;

  private readonly initialProperties: Readonly<TileDataProperties>;
  private readonly reproductionCost: number;
  private readonly evolutionBehaviors: ReadonlyArray<EvolutionBehavior>;
  private readonly weatherBehaviors: ReadonlyArray<WeatherBehavior>;
  private readonly birthModifiers: ReadonlyArray<BirthModifierDefinition>;

  constructor(definition: EssenceDefinition) {
    validateDefinition(definition);
    this.id = definition.id;
    this.evolutionFamilyId = definition.evolutionFamilyId ?? definition.id;
    this.evolutionPriority = definition.evolutionPriority ?? 0;
    this.name = definition.name;
    this.color = definition.color;
    this.initialProperties = Object.freeze({
      ...(definition.initialProperties ?? DEFAULT_PROPERTIES),
    });
    this.reproductionCost = definition.reproductionCost ?? 1;
    this.evolutionBehaviors = Object.freeze([
      ...(definition.evolutionBehaviors ?? []),
    ]);
    this.weatherBehaviors = Object.freeze([
      ...(definition.weatherBehaviors ?? []),
    ]);
    this.birthModifiers = Object.freeze([...(definition.birthModifiers ?? [])]);
  }

  getInitialProperties(): EssenceProperties {
    return { ...this.initialProperties };
  }

  createTileData(): TileData {
    return new TileData(this.initialProperties);
  }

  getReproductionCost(): number {
    return this.reproductionCost;
  }

  getBirthModifiers(): ReadonlyArray<BirthModifierDefinition> {
    return this.birthModifiers;
  }

  getWeatherRepercussion(
    weather: Readonly<WeatherSnapshot>,
  ): EssencePropertiesDelta {
    const delta: MutableTileDataDelta = {};

    for (const behavior of this.weatherBehaviors) {
      mergeDelta(delta, behavior.evaluate(weather));
    }

    return delta;
  }

  evolve(input: EssenceEvolutionInput): EssenceEvolutionResult {
    const aliveIndices = new Set(input.aliveIndices);
    const births: EssenceBirth[] = [];

    for (const behavior of this.evolutionBehaviors) {
      const proposal = behavior.evaluate(input);

      for (const index of proposal.deaths ?? []) {
        aliveIndices.delete(index);
      }

      for (const birth of proposal.births ?? []) {
        if (input.globalLivingIndices.has(birth.index)) {
          continue;
        }

        aliveIndices.add(birth.index);
        // Les propositions restent séparées et ordonnées. L'arbitre essaiera
        // la suivante si une proposition prioritaire ne peut pas être payée.
        births.push(birth);
      }
    }

    return {
      aliveIndices: [...aliveIndices],
      births,
    };
  }
}

type MutableTileDataDelta = {
  -readonly [Property in keyof TileDataProperties]?: number;
};

function mergeDelta(target: MutableTileDataDelta, source: TileDataDelta): void {
  for (const property of ["life", "maximumLife", "reproducibility"] as const) {
    if (source[property] !== undefined) {
      target[property] = (target[property] ?? 0) + source[property];
    }
  }
}

function validateDefinition(definition: EssenceDefinition): void {
  if (!definition.id.trim()) {
    throw new RangeError("essence id must not be empty");
  }
  if (!definition.name.trim()) {
    throw new RangeError("essence name must not be empty");
  }
  const evolutionFamilyId = definition.evolutionFamilyId ?? definition.id;
  if (!evolutionFamilyId.trim()) {
    throw new RangeError("evolutionFamilyId must not be empty");
  }
  const evolutionPriority = definition.evolutionPriority ?? 0;
  if (!Number.isSafeInteger(evolutionPriority) || evolutionPriority < 0) {
    throw new RangeError(
      "evolutionPriority must be a non-negative safe integer",
    );
  }
  if (!Number.isSafeInteger(definition.color) || definition.color < 0) {
    throw new RangeError("essence color must be a non-negative safe integer");
  }

  const properties = definition.initialProperties ?? DEFAULT_PROPERTIES;
  // TileData centralise la validation des propriétés effectives.
  new TileData(properties);

  const reproductionCost = definition.reproductionCost ?? 1;
  if (!Number.isFinite(reproductionCost) || reproductionCost < 0) {
    throw new RangeError(
      "reproductionCost must be a non-negative finite number",
    );
  }

  validateUniqueBehaviorIds(definition.evolutionBehaviors ?? [], "evolution");
  validateUniqueBehaviorIds(definition.weatherBehaviors ?? [], "weather");
}

function validateUniqueBehaviorIds(
  behaviors: ReadonlyArray<{ readonly id: string }>,
  kind: string,
): void {
  const ids = new Set<string>();
  for (const behavior of behaviors) {
    if (!behavior.id.trim() || ids.has(behavior.id)) {
      throw new RangeError(`${kind} behavior ids must be unique and non-empty`);
    }
    ids.add(behavior.id);
  }
}

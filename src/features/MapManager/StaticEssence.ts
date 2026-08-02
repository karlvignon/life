import type {
  Essence,
  EssenceEvolutionInput,
  EssenceEvolutionResult,
} from "./Essence";

export const DEFAULT_STATIC_COLOR = 0xf97316;

/** Essence immobile — les cellules placées ne changent jamais d'état. */
export class StaticEssence implements Essence {
  readonly color: number;

  constructor(color: number = DEFAULT_STATIC_COLOR) {
    this.color = color;
  }

  evolve(input: EssenceEvolutionInput): EssenceEvolutionResult {
    return { aliveCells: [...input.aliveCells] };
  }
}

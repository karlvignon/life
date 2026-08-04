import {
  Essence,
  type EssenceEvolutionInput,
  type EssenceEvolutionResult,
} from "./Essence";

export const DEFAULT_STATIC_COLOR = 0xf97316;

/** Essence immobile — les cellules placées ne changent jamais d'état. */
export class StaticEssence extends Essence {
  readonly color: number;
  readonly id: Essence["id"] = "static";
  readonly name: string = "Static";

  constructor(color: number = DEFAULT_STATIC_COLOR) {
    super();
    this.color = color;
  }

  evolve(input: EssenceEvolutionInput): EssenceEvolutionResult {
    return { aliveIndices: [...input.aliveIndices] };
  }
}

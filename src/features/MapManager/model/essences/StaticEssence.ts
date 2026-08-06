import { Essence, type EssenceDefinition } from "./Essence";

export const DEFAULT_STATIC_COLOR = 0xf97316;

export class StaticEssence extends Essence {
  constructor(
    color: number = DEFAULT_STATIC_COLOR,
    overrides: Partial<EssenceDefinition> = {},
  ) {
    super({
      id: "static",
      name: "Static",
      color,
      ...overrides,
    });
  }
}

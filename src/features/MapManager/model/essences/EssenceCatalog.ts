import type { EssenceId } from "../../../../core/types/cards";
import type { Essence } from "./Essence";
import { FloraEssence } from "./FloraEssence";
import { GameOfLifeEssence } from "./GameOfLifeEssence";
import { HighLifeEssence } from "./HighLifeEssence";
import { MushroomEssence } from "./MushroomEssence";
import { StaticEssence } from "./StaticEssence";
import { TreeEssence } from "./TreeEssence";

type EssenceFactory = () => Essence;

const ESSENCE_FACTORIES: Readonly<Record<EssenceId, EssenceFactory>> = {
  "game-of-life": () => new GameOfLifeEssence(),
  "high-life": () => new HighLifeEssence(),
  static: () => new StaticEssence(),
  mushroom: () => new MushroomEssence(),
  flora: () => new FloraEssence(),
  tree: () => new TreeEssence(),
};

export function createEssence(essenceId: EssenceId): Essence {
  return ESSENCE_FACTORIES[essenceId]();
}

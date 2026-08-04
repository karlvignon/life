import type { CardPatternId } from "../../../../core/types/cards";
import { GenesisSpaceship } from "../spaceships/GenesisSpaceship";
import { GliderSpaceship } from "../spaceships/GliderSpaceship";
import { LightweightSpaceship } from "../spaceships/LightweightSpaceship";
import { MiddleweightSpaceship } from "../spaceships/MiddleweightSpaceship";
import { FLORA_BIRTH_PATTERN } from "../essences/FloraEssence";
import { MUSHROOM_BIRTH_PATTERN } from "../essences/MushroomEssence";
import { TREE_BIRTH_PATTERN } from "../essences/TreeEssence";
import { BlinkerOscillator } from "./BlinkerOscillator";
import { FiveCellCrossPattern } from "./FiveCellCrossPattern";
import { HighLifeReplicator } from "./HighLifeReplicator";
import { HorizontalLinePattern } from "./HorizontalLinePattern";
import type { Pattern } from "./Pattern";
import { PatternDuplicatorCardPattern } from "./PatternDuplicatorCardPattern";
import { SingleCellPattern } from "./SingleCellPattern";
import { ToadOscillator } from "./ToadOscillator";

type PatternFactory = () => Pattern;

const PATTERN_FACTORIES: Readonly<Record<CardPatternId, PatternFactory>> = {
  genesis: () => new GenesisSpaceship(),
  glider: () => new GliderSpaceship(),
  lwss: () => new LightweightSpaceship(),
  mwss: () => new MiddleweightSpaceship(),
  blinker: () => new BlinkerOscillator(),
  toad: () => new ToadOscillator(),
  replicator: () => new HighLifeReplicator(),
  cell: () => new SingleCellPattern(),
  "horizontal-line": () => new HorizontalLinePattern(),
  "five-cell-cross": () => new FiveCellCrossPattern(),
  "mushroom-birth": () =>
    new PatternDuplicatorCardPattern("mushroom-birth", MUSHROOM_BIRTH_PATTERN),
  "flora-birth": () =>
    new PatternDuplicatorCardPattern("flora-birth", FLORA_BIRTH_PATTERN),
  "tree-birth": () =>
    new PatternDuplicatorCardPattern("tree-birth", TREE_BIRTH_PATTERN),
};

export function createPattern(patternId: CardPatternId): Pattern {
  return PATTERN_FACTORIES[patternId]();
}

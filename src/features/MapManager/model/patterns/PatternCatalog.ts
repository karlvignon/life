import type { CardPatternId } from "../../../../core/types/cards";
import { GenesisSpaceship } from "../spaceships/GenesisSpaceship";
import { GliderSpaceship } from "../spaceships/GliderSpaceship";
import { LightweightSpaceship } from "../spaceships/LightweightSpaceship";
import { MiddleweightSpaceship } from "../spaceships/MiddleweightSpaceship";
import { BlinkerOscillator } from "./BlinkerOscillator";
import { FiveCellCrossPattern } from "./FiveCellCrossPattern";
import { HighLifeReplicator } from "./HighLifeReplicator";
import { HorizontalLinePattern } from "./HorizontalLinePattern";
import type { Pattern } from "./Pattern";
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
};

export function createPattern(patternId: CardPatternId): Pattern {
  return PATTERN_FACTORIES[patternId]();
}

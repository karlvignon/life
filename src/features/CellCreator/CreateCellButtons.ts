import {
  BlinkerOscillator,
  GenesisSpaceship,
  GameOfLifeEssence,
  GliderSpaceship,
  GosperGliderGun,
  HighLifeEssence,
  HighLifeReplicator,
  LightweightSpaceship,
  MiddleweightSpaceship,
  MushroomEssence,
  Placeable,
  Puffer1,
  Puffer2,
  SimkinGliderGun,
  SingleCellPattern,
  StaticEssence,
  ToadOscillator,
  Tree,
  type Pattern,
} from "../MapManager/main";
import type { CellCreatorEventManager } from "./CellCreatorEventManager";
import { ClearButtonView } from "./ClearButtonView";
import { CreateCellButtonView } from "./CreateCellButtonView";

interface PatternButtonDefinition {
  label: string;
  pattern: Pattern;
}

export type ToolbarButton = CreateCellButtonView | ClearButtonView;

function buildGameOfLifePatternButtonDefinitions(): PatternButtonDefinition[] {
  const essence = new MushroomEssence();

  return [
    { label: "Genesis", pattern: new GenesisSpaceship(essence) },
    { label: "Glider", pattern: new GliderSpaceship(essence) },
    { label: "LWSS", pattern: new LightweightSpaceship(essence) },
    { label: "MWSS", pattern: new MiddleweightSpaceship(essence) },
    { label: "Blinker", pattern: new BlinkerOscillator(essence) },
    { label: "Toad", pattern: new ToadOscillator(essence) },
    { label: "Puffer 1", pattern: new Puffer1(essence) },
    { label: "Puffer 2", pattern: new Puffer2(essence) },
    { label: "Gosper", pattern: new GosperGliderGun(essence) },
    { label: "Simkin", pattern: new SimkinGliderGun(essence) },
  ];
}

function buildHighLifePatternButtonDefinitions(): PatternButtonDefinition[] {
  const highLifeEssence = new HighLifeEssence();

  return [
    {
      label: "Replicator",
      pattern: new HighLifeReplicator(highLifeEssence),
    },
  ];
}

function buildStaticPatternButtonDefinitions(): PatternButtonDefinition[] {
  const staticEssence = new StaticEssence();

  return [{ label: "Tree", pattern: new Tree(staticEssence) }];
}

function buildMushroomPatternButtonDefinitions(): PatternButtonDefinition[] {
  const mushroomEssence = new MushroomEssence();

  return [
    { label: "Mushroom", pattern: new SingleCellPattern(mushroomEssence) },
  ];
}

export function createToolbarButtons(
  eventManager: CellCreatorEventManager,
): ToolbarButton[] {
  const patternButtons = [
    ...buildGameOfLifePatternButtonDefinitions(),
    ...buildHighLifePatternButtonDefinitions(),
    ...buildStaticPatternButtonDefinitions(),
    ...buildMushroomPatternButtonDefinitions(),
  ].map(
    ({ label, pattern }) =>
      new CreateCellButtonView(
        eventManager,
        new Placeable(pattern, 0, 0),
        label,
      ),
  );

  return [...patternButtons, new ClearButtonView(eventManager)];
}

export function isCreateCellButtonView(
  button: ToolbarButton,
): button is CreateCellButtonView {
  return button instanceof CreateCellButtonView;
}

import {
  BlinkerOscillator,
  GameOfLifeEssence,
  GenesisSpaceship,
  GliderSpaceship,
  HighLifeEssence,
  HighLifeReplicator,
  LightweightSpaceship,
  MiddleweightSpaceship,
  MushroomEssence,
  SingleCellPattern,
  StaticEssence,
  ToadOscillator,
  type Essence,
} from "../MapManager/main";
import type { CellCreatorEventManager } from "./CellCreatorEventManager";
import { ClearButtonView } from "./ClearButtonView";
import { CreateCellButtonView } from "./CreateCellButtonView";
import type { EssenceDefinition, PatternDefinition, PatternId } from "./types";

export type ToolbarButton = CreateCellButtonView | ClearButtonView;

export const ESSENCE_DEFINITIONS: ReadonlyArray<EssenceDefinition> = [
  {
    id: "game-of-life",
    label: "Conway",
    essence: new GameOfLifeEssence(),
  },
  {
    id: "high-life",
    label: "HighLife",
    essence: new HighLifeEssence(),
  },
  {
    id: "static",
    label: "Static",
    essence: new StaticEssence(),
  },
  {
    id: "mushroom",
    label: "Mushroom",
    essence: new MushroomEssence(),
  },
];

export const DEFAULT_ESSENCE_DEFINITION = ESSENCE_DEFINITIONS[0]!;

export const PATTERN_DEFINITIONS: ReadonlyArray<PatternDefinition> = [
  {
    id: "genesis",
    label: "Genesis",
    createPattern: (essence) => new GenesisSpaceship(essence),
  },
  {
    id: "glider",
    label: "Glider",
    createPattern: (essence) => new GliderSpaceship(essence),
  },
  {
    id: "lwss",
    label: "LWSS",
    createPattern: (essence) => new LightweightSpaceship(essence),
  },
  {
    id: "mwss",
    label: "MWSS",
    createPattern: (essence) => new MiddleweightSpaceship(essence),
  },
  {
    id: "blinker",
    label: "Blinker",
    createPattern: (essence) => new BlinkerOscillator(essence),
  },
  {
    id: "toad",
    label: "Toad",
    createPattern: (essence) => new ToadOscillator(essence),
  },
  {
    id: "replicator",
    label: "Replicator",
    createPattern: (essence) => new HighLifeReplicator(essence),
  },
  {
    id: "cell",
    label: "Cell",
    createPattern: (essence) => new SingleCellPattern(essence),
  },
];

export function getEssenceDefinition(
  essenceId: EssenceDefinition["id"],
): EssenceDefinition | undefined {
  return ESSENCE_DEFINITIONS.find(({ id }) => id === essenceId);
}

export function getPatternDefinition(
  patternId: PatternId,
): PatternDefinition | undefined {
  return PATTERN_DEFINITIONS.find(({ id }) => id === patternId);
}

export function createToolbarButtons(
  eventManager: CellCreatorEventManager,
  selectedEssence: Essence,
): ToolbarButton[] {
  const patternButtons = PATTERN_DEFINITIONS.map(
    (definition) =>
      new CreateCellButtonView(eventManager, definition, selectedEssence),
  );

  return [...patternButtons, new ClearButtonView(eventManager)];
}

export function isCreateCellButtonView(
  button: ToolbarButton,
): button is CreateCellButtonView {
  return button instanceof CreateCellButtonView;
}

import type { Essence } from "../MapManager/Essence";
import { GenesisSpaceship } from "../MapManager/GenesisSpaceship";
import { GliderSpaceship } from "../MapManager/GliderSpaceship";
import { HighLifeEssence } from "../MapManager/HighLifeEssence";
import { LightweightSpaceship } from "../MapManager/LightweightSpaceship";
import { MiddleweightSpaceship } from "../MapManager/MiddleweightSpaceship";
import { Placeable } from "../MapManager/Placeable";
import type { Pattern } from "../MapManager/Pattern";
import { BlinkerOscillator } from "../MapManager/patterns/BlinkerOscillator";
import { GosperGliderGun } from "../MapManager/patterns/GosperGliderGun";
import { HighLifeReplicator } from "../MapManager/patterns/HighLifeReplicator";
import { Tree } from "../MapManager/patterns/Tree";
import { Puffer1 } from "../MapManager/patterns/Puffer1";
import { StaticEssence } from "../MapManager/StaticEssence";
import { Puffer2 } from "../MapManager/patterns/Puffer2";
import { SimkinGliderGun } from "../MapManager/patterns/SimkinGliderGun";
import { ToadOscillator } from "../MapManager/patterns/ToadOscillator";
import type { CellCreatorEventManager } from "./CellCreatorEventManager";
import { ClearUiButton } from "./ClearUiButton";
import { CreateCellUiButton } from "./CreateCellUiButton";

interface PatternButtonDefinition {
  label: string;
  pattern: Pattern;
}

export type ToolbarButton = CreateCellUiButton | ClearUiButton;

function buildPatternButtonDefinitions(
  essence: Essence,
): PatternButtonDefinition[] {
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

export function createToolbarButtons(
  eventManager: CellCreatorEventManager,
  essence: Essence,
): ToolbarButton[] {
  const patternButtons = [
    ...buildPatternButtonDefinitions(essence),
    ...buildHighLifePatternButtonDefinitions(),
    ...buildStaticPatternButtonDefinitions(),
  ].map(
    ({ label, pattern }) =>
      new CreateCellUiButton(eventManager, new Placeable(pattern, 0, 0), label),
  );

  return [...patternButtons, new ClearUiButton(eventManager)];
}

export function isCreateCellUiButton(
  button: ToolbarButton,
): button is CreateCellUiButton {
  return button instanceof CreateCellUiButton;
}

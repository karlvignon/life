import type { PlayerId } from "../../core/types/player";
import type { MapModel } from "./MapModel";
import type { Essence } from "./model/essences/Essence";
import type { TileProvenance } from "./types";

export const TEST_PLAYER_ID: PlayerId = "test-player";
export const OTHER_TEST_PLAYER_ID: PlayerId = "other-test-player";

export const TEST_PROVENANCE: TileProvenance = Object.freeze({
  kind: "player-placement",
  playerId: TEST_PLAYER_ID,
});

export const OTHER_TEST_PROVENANCE: TileProvenance = Object.freeze({
  kind: "player-placement",
  playerId: OTHER_TEST_PLAYER_ID,
});

export function setTestCellAlive(
  model: MapModel,
  x: number,
  y: number,
  essence: Essence,
  provenance: TileProvenance = TEST_PROVENANCE,
) {
  return model.setCellAlive(x, y, essence, provenance);
}

export function placeTestCells(
  model: MapModel,
  cells: ReadonlyArray<{ x: number; y: number }>,
  essence: Essence,
  provenance: TileProvenance = TEST_PROVENANCE,
) {
  return model.placeCells(cells, essence, provenance);
}

import type { Placeable } from "../../features/MapManager/main";

export type GameEventMap = {
  "game:speed-changed": { speed: number };
  "game:placeable-selected": { placeable: Placeable | null };
};

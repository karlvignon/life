import type { Placeable } from "../../features/MapManager/main";
import type {
  WeatherOverride,
  WeatherSnapshot,
  WeatherTransition,
} from "./weather";

export interface GameSpeedSnapshot {
  speed: number;
  minSpeed: number;
  maxSpeed: number;
}

export type GameEventMap = {
  "game:speed-changed": GameSpeedSnapshot;
  "game:season-progressed": WeatherTransition;
  "game:weather-changed": WeatherSnapshot;
  "dev:speed-change-requested": { speed: number };
  "dev:weather-override-changed": WeatherOverride;
  "dev:card-stamina-cost-changed": { disabled: boolean };
  "dev:reproductibility-map-changed": { enabled: boolean };
  "dev:team-colors-changed": { enabled: boolean };
  "game:placeable-selected": { placeable: Placeable | null };
};

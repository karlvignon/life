import type { Placeable } from "../../features/MapManager/main";
import type {
  WeatherOverride,
  WeatherSnapshot,
  WeatherTransition,
} from "./weather";

export type GameEventMap = {
  "game:speed-changed": { speed: number };
  "game:season-progressed": WeatherTransition;
  "game:weather-changed": WeatherSnapshot;
  "dev:weather-override-changed": WeatherOverride;
  "dev:card-stamina-cost-changed": { disabled: boolean };
  "dev:reproductibility-map-changed": { enabled: boolean };
  "game:placeable-selected": { placeable: Placeable | null };
};

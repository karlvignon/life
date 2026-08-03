export type {
  SeasonWeatherSnapshot,
  WeatherRange,
  WeatherSnapshot,
  WeatherTransition,
  WeatherValues,
} from "../../core/types/weather";

export interface WeatherUiLayoutConfig {
  anchor: { x: number; y: number };
  horizontalAlign: "start" | "center" | "end";
  verticalAlign: "start" | "center" | "end";
  margin?: { x: number; y: number };
}

export interface WeatherConfig {
  layout?: WeatherUiLayoutConfig;
}

export const DEFAULT_WEATHER_UI_LAYOUT: WeatherUiLayoutConfig = {
  anchor: { x: 0.5, y: 0 },
  horizontalAlign: "center",
  verticalAlign: "start",
  margin: { x: 0, y: 12 },
};

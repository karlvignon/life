export type WeatherRange = readonly [min: number, max: number];

export interface SeasonWeatherSnapshot {
  windStrenghRange: WeatherRange;
  degreeRange: WeatherRange;
}

export interface WeatherTransition {
  currentSeason: SeasonWeatherSnapshot;
  nextSeason: SeasonWeatherSnapshot;
  progress: number;
}

export interface WeatherSnapshot {
  windStrength: number;
  degrees: number;
}

export type WeatherRange = readonly [min: number, max: number];

export interface SeasonWeatherSnapshot {
  windStrenghRange: WeatherRange;
  degreeRange: WeatherRange;
}

export interface WeatherTransition {
  currentCycle: number;
  currentSeason: SeasonWeatherSnapshot;
  nextSeason: SeasonWeatherSnapshot;
  progress: number;
}

export interface WeatherSnapshot {
  windStrength: number;
  degrees: number;
}

export interface WeatherOverride extends WeatherSnapshot {
  enabled: boolean;
}

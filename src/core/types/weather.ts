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

export interface WeatherValues {
  readonly windStrength: number;
  readonly degrees: number;
}

export interface WeatherSnapshot extends WeatherValues {
  readonly cycle: number;
}

export interface WeatherOverride extends WeatherValues {
  readonly enabled: boolean;
}

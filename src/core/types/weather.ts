export type WeatherRange = readonly [min: number, max: number];

export type SeasonName = "Spring" | "Summer" | "Autumn" | "Winter";

export interface SeasonWeatherSnapshot {
  name: SeasonName;
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
  readonly season: SeasonName;
}

export interface WeatherOverride extends WeatherValues {
  readonly enabled: boolean;
}

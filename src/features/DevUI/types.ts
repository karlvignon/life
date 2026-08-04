export interface DevOptions {
  display: {
    devUi: boolean;
    displayChunkRender: boolean;
  };
}

export type DevUIEventMap = {
  "card-stamina-cost:toggle": { disabled: boolean };
  "weather-override:toggle": { enabled: boolean };
  "weather-override:wind-change": { windStrength: number };
  "weather-override:degrees-change": { degrees: number };
};

export const MIN_OVERRIDE_WIND_STRENGTH = 0;
export const MAX_OVERRIDE_WIND_STRENGTH = 50;
export const MIN_OVERRIDE_DEGREES = -20;
export const MAX_OVERRIDE_DEGREES = 50;

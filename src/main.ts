import { Application } from "pixi.js";
import { Game } from "./core/Game";
import type { DevOptions } from "./features/DevUI/main";

const devOptions = {
  display: {
    devUi: true,
    displayChunkRender: false,
  },
} satisfies DevOptions;

(async () => {
  const app = new Application();

  await app.init({
    background: "#1099bb",
    resizeTo: window,
    resolution: window.devicePixelRatio,
    autoDensity: true,
  });

  document.getElementById("pixi-container")!.appendChild(app.canvas);

  new Game(app, {
    gameOptions: {
      initialSpeed: 1,
      maxSpeed: 20,
      minSpeed: 0,
    },
    devOptions,
  });
})();

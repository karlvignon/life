import { Application } from "pixi.js";
import { Game } from "./core/Game";
import type { DevOptions } from "./features/DevUI/main";

const devOptions = {
  display: {
    devUi: true,
  },
} satisfies DevOptions;

(async () => {
  const app = new Application();

  await app.init({ background: "#1099bb", resizeTo: window });

  document.getElementById("pixi-container")!.appendChild(app.canvas);

  new Game(app, {
    gameOptions: {
      initialSpeed: 1,
      maxSpeed: 200,
    },
    devOptions,
  });
})();

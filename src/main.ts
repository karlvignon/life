import { Application } from "pixi.js";
import { Game } from "./core/Game";
import {
  GameOfLifeEssence,
  GenesisSpaceship,
} from "./features/MapManager/main";

(async () => {
  const app = new Application();

  await app.init({ background: "#1099bb", resizeTo: window });

  document.getElementById("pixi-container")!.appendChild(app.canvas);

  const defaultEssence = new GameOfLifeEssence();

  new Game(app, {
    defaultEssence,
    map: {
      initialSpaceship: new GenesisSpaceship(defaultEssence),
    },
    gameOptions: {
      initialSpeed: 0,
    },
  });
})();

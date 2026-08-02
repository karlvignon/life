import { Application, Container } from "pixi.js";
import { DevUIModel } from "./DevUIModel";
import { DevUIView } from "./DevUIView";

export type { DevOptions } from "./types";

export class DevUIManager {
  private readonly app: Application;
  private readonly uiRoot: Container;
  private readonly model = new DevUIModel();
  private readonly view = new DevUIView();

  constructor(app: Application) {
    this.app = app;
    this.uiRoot = new Container();
    this.uiRoot.label = "devUiRoot";
    this.uiRoot.eventMode = "none";
    this.uiRoot.addChild(this.view);
    this.app.stage.addChild(this.uiRoot);
  }

  update(): void {
    this.model.setFps(this.app.ticker.FPS);
  }

  render(): void {
    this.view.syncFromModel(this.model);
  }

  recordRenderTime(renderTimeMs: number): void {
    this.model.addRenderTime(renderTimeMs);
  }

  destroy(): void {
    this.view.destroy();
    this.uiRoot.destroy({ children: true });
    this.app.stage.removeChild(this.uiRoot);
  }
}

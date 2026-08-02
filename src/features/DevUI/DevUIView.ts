import { Container, Graphics, Text } from "pixi.js";
import type { DevUIModel } from "./DevUIModel";

const PANEL_PADDING = 8;
const PANEL_BACKGROUND = 0x111827;
const PANEL_BORDER = 0x374151;
const TEXT_COLOR = 0x00ff88;

export class DevUIView extends Container {
  private readonly background: Graphics;
  private readonly statsText: Text;

  constructor() {
    super();

    this.background = new Graphics();
    this.statsText = new Text({
      text: "FPS: 0\nRender CPU: 0.00 ms",
      style: {
        fill: TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: 14,
      },
    });

    this.statsText.position.set(PANEL_PADDING, PANEL_PADDING);
    this.addChild(this.background, this.statsText);
    this.position.set(12, 12);
    this.drawBackground();
  }

  syncFromModel(model: DevUIModel): void {
    const text = [
      `FPS: ${model.getFps()}`,
      `Render CPU: ${model.getAverageRenderTimeMs().toFixed(2)} ms`,
    ].join("\n");

    if (this.statsText.text === text) {
      return;
    }

    this.statsText.text = text;
    this.drawBackground();
  }

  destroy(): void {
    super.destroy({ children: true });
  }

  private drawBackground(): void {
    const width = this.statsText.width + PANEL_PADDING * 2;
    const height = this.statsText.height + PANEL_PADDING * 2;

    this.background.clear();
    this.background
      .roundRect(0, 0, width, height, 6)
      .fill(PANEL_BACKGROUND)
      .stroke({ width: 1, color: PANEL_BORDER });
  }
}

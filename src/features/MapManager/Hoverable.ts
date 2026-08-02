import { Container, Rectangle } from "pixi.js";
import { MapEventManager } from "./MapEventManager";
import { Tile } from "./model/Tile";

export class Hoverable {
  private readonly onPointerOver: () => void;
  private readonly onPointerOut: () => void;
  private bound = false;

  constructor(
    private readonly target: Container,
    private readonly tile: Tile,
    private readonly eventManager: MapEventManager,
    private readonly cellSize: number,
  ) {
    this.onPointerOver = (): void => {
      this.eventManager.emit("tile:hover", this.tile);
    };

    this.onPointerOut = (): void => {
      this.eventManager.emit("tile:leave", undefined);
    };
  }

  bind(): void {
    if (this.bound) {
      return;
    }

    this.target.eventMode = "static";
    this.target.cursor = "pointer";
    this.target.hitArea = new Rectangle(0, 0, this.cellSize, this.cellSize);
    this.target.on("pointerover", this.onPointerOver);
    this.target.on("pointerout", this.onPointerOut);
    this.bound = true;
  }

  unbind(): void {
    if (!this.bound) {
      return;
    }

    this.target.off("pointerover", this.onPointerOver);
    this.target.off("pointerout", this.onPointerOut);
    this.target.eventMode = "passive";
    this.target.cursor = "default";
    this.target.hitArea = null;
    this.bound = false;
  }

  destroy(): void {
    this.unbind();
  }
}

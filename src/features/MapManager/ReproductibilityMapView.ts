import { Container, Graphics, Text } from "pixi.js";
import type { ReproductibilityMapSnapshot } from "./render/types";

const BACKGROUND_COLOR = 0x000000;
const BACKGROUND_ALPHA = 0.55;
const TEXT_COLOR = 0xffffff;

/** Overlay de debug affichant le score de reproductibilité des cellules. */
export class ReproductibilityMapView extends Container {
  private readonly backgrounds = new Graphics();
  private readonly labels = new Map<string, Text>();

  constructor(private readonly cellSize: number) {
    super();
    this.eventMode = "none";
    this.visible = false;
    this.addChild(this.backgrounds);
  }

  sync(snapshot: ReproductibilityMapSnapshot): void {
    const activeLabels = new Set<string>();
    this.backgrounds.clear();

    for (const cell of snapshot.livingCells) {
      const key = `${cell.x},${cell.y}`;
      activeLabels.add(key);
      this.backgrounds
        .rect(
          cell.x * this.cellSize,
          cell.y * this.cellSize,
          this.cellSize,
          this.cellSize,
        )
        .fill({ color: BACKGROUND_COLOR, alpha: BACKGROUND_ALPHA });

      const label = this.getOrCreateLabel(key);
      label.text = formatReproductibilityScore(cell.score);
      label.style.fontSize = getScoreFontSize(label.text, this.cellSize);
      label.position.set(
        cell.x * this.cellSize + this.cellSize / 2,
        cell.y * this.cellSize + this.cellSize / 2,
      );
    }

    for (const [key, label] of this.labels) {
      if (activeLabels.has(key)) {
        continue;
      }

      this.removeChild(label);
      label.destroy();
      this.labels.delete(key);
    }
  }

  clear(): void {
    this.backgrounds.clear();

    for (const label of this.labels.values()) {
      this.removeChild(label);
      label.destroy();
    }
    this.labels.clear();
  }

  override destroy(): void {
    this.clear();
    super.destroy({ children: true });
  }

  private getOrCreateLabel(key: string): Text {
    const existing = this.labels.get(key);
    if (existing) {
      return existing;
    }

    const label = new Text({
      text: "",
      style: {
        fill: TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: getScoreFontSize("10", this.cellSize),
        fontWeight: "700",
      },
    });
    label.anchor.set(0.5);
    this.labels.set(key, label);
    this.addChild(label);
    return label;
  }
}

export function formatReproductibilityScore(score: number): string {
  return Number.isInteger(score)
    ? score.toString()
    : Number(score.toFixed(2)).toString();
}

function getScoreFontSize(text: string, cellSize: number): number {
  const baseSize = Math.max(8, Math.floor(cellSize * 0.6));
  const widthLimitedSize = Math.floor(
    (Math.max(1, cellSize - 2) / Math.max(1, text.length)) * 1.6,
  );
  return Math.max(4, Math.min(baseSize, widthLimitedSize));
}

import type { Tile } from "../Tile";

export interface BehaviorInheritanceParent {
  readonly cell: Tile;
  readonly paidPoints: number;
}

export interface BehaviorInheritance {
  inheritBehaviors(
    newbornCell: Tile,
    parents: ReadonlyArray<BehaviorInheritanceParent>,
  ): void;
}

export interface BehaviorInheritanceModelConfig {
  /** Source aléatoire utilisée uniquement pour départager des paiements égaux. */
  readonly paymentTieBreakerRandomSource?: () => number;
}

/** Applique à une cellule les behaviors héritables de son parent contributeur. */
export class BehaviorInheritanceModel implements BehaviorInheritance {
  private readonly paymentTieBreakerRandomSource: () => number;

  constructor(config: BehaviorInheritanceModelConfig = {}) {
    this.paymentTieBreakerRandomSource =
      config.paymentTieBreakerRandomSource ?? Math.random;
  }

  inheritBehaviors(
    newbornCell: Tile,
    parents: ReadonlyArray<BehaviorInheritanceParent>,
  ): void {
    if (parents.length === 0) {
      throw new RangeError("behavior inheritance requires at least one parent");
    }

    for (const { paidPoints } of parents) {
      if (!Number.isFinite(paidPoints) || paidPoints < 0) {
        throw new RangeError(
          "behavior inheritance parent payment must be non-negative and finite",
        );
      }
    }

    const highestPayment = Math.max(
      ...parents.map(({ paidPoints }) => paidPoints),
    );
    const tiedParents = parents.filter(
      ({ paidPoints }) => paidPoints === highestPayment,
    );
    const behaviorParent =
      tiedParents.length === 1
        ? tiedParents[0]
        : tiedParents[this.selectRandomIndex(tiedParents.length)];

    newbornCell.setBehaviors(
      behaviorParent.cell
        .getBehaviors()
        .filter((behavior) => behavior.inheritable),
    );
  }

  private selectRandomIndex(length: number): number {
    const randomValue = this.paymentTieBreakerRandomSource();
    if (randomValue < 0 || randomValue >= 1 || !Number.isFinite(randomValue)) {
      throw new RangeError(
        "payment tie-breaker random source must return a finite value in [0, 1)",
      );
    }

    return Math.floor(randomValue * length);
  }
}

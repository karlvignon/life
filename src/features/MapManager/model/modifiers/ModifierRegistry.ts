import { Modifier } from "./Modifier";

interface ActiveModifier {
  readonly targetX: number;
  readonly targetY: number;
  readonly modifier: Modifier;
  readonly expiresAfterCycle: number | null;
}

/** Source de vérité des modifiers, indexés par cible et incarnation source. */
export class ModifierRegistry {
  private active: ActiveModifier[] = [];

  getAt(targetX: number, targetY: number): ReadonlyArray<Modifier> {
    return this.active.flatMap((entry) =>
      entry.targetX === targetX && entry.targetY === targetY
        ? [entry.modifier]
        : [],
    );
  }

  add(
    targetX: number,
    targetY: number,
    modifier: Modifier,
    currentCycle: number,
  ): void {
    this.active = this.active.filter(
      (entry) =>
        !(
          entry.targetX === targetX &&
          entry.targetY === targetY &&
          entry.modifier.key === modifier.key &&
          entry.modifier.author.lifeId !== undefined &&
          entry.modifier.author.lifeId === modifier.author.lifeId &&
          entry.modifier.author.behaviorId === modifier.author.behaviorId
        ),
    );

    this.active.push({
      targetX,
      targetY,
      modifier,
      expiresAfterCycle:
        modifier.lifetime.type === "cycles"
          ? currentCycle + modifier.lifetime.duration - 1
          : null,
    });
  }

  removeSource(lifeId: string): void {
    this.removeWhere(
      (entry) =>
        entry.modifier.author.lifeId === lifeId &&
        entry.modifier.lifetime.type === "while-source-alive",
    );
  }

  remove(
    targetX: number,
    targetY: number,
    key: string,
    sourceLifeId: string | undefined,
  ): void {
    this.removeWhere(
      (entry) =>
        entry.targetX === targetX &&
        entry.targetY === targetY &&
        entry.modifier.key === key &&
        (sourceLifeId === undefined ||
          entry.modifier.author.lifeId === sourceLifeId),
    );
  }

  expireBeforeCycle(currentCycle: number): void {
    this.removeWhere(
      ({ expiresAfterCycle }) =>
        expiresAfterCycle !== null && expiresAfterCycle < currentCycle,
    );
  }

  clear(): void {
    this.active = [];
  }

  pruneTargets(isValid: (x: number, y: number) => boolean): void {
    this.removeWhere((entry) => !isValid(entry.targetX, entry.targetY));
  }

  private removeWhere(predicate: (entry: ActiveModifier) => boolean): void {
    this.active = this.active.filter((entry) => !predicate(entry));
  }
}

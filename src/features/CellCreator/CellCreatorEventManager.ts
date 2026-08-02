import { EventBus } from "../../core/EventBus";
import type { CellCreatorEventMap } from "./types";

export class CellCreatorEventManager {
  private readonly bus = new EventBus();
  private unsubscribers: Array<() => void> = [];

  on<K extends keyof CellCreatorEventMap>(
    event: K,
    handler: (payload: CellCreatorEventMap[K]) => void,
  ): () => void {
    const unsubscribe = this.bus.on(event, handler);
    this.unsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  emit<K extends keyof CellCreatorEventMap>(
    event: K,
    payload: CellCreatorEventMap[K],
  ): void {
    this.bus.emit(event, payload);
  }

  destroy(): void {
    for (const unsubscribe of this.unsubscribers) {
      unsubscribe();
    }
    this.unsubscribers = [];
    this.bus.clear();
  }
}

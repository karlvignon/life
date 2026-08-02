import { EventBus } from "../../core/EventBus";
import type { GameOptionsEventMap } from "./types";

export class GameOptionsEventManager {
  private readonly bus = new EventBus();
  private unsubscribers: Array<() => void> = [];

  on<K extends keyof GameOptionsEventMap>(
    event: K,
    handler: (payload: GameOptionsEventMap[K]) => void,
  ): () => void {
    const unsubscribe = this.bus.on(event, handler);
    this.unsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  emit<K extends keyof GameOptionsEventMap>(
    event: K,
    payload: GameOptionsEventMap[K],
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

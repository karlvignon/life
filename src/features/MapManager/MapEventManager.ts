import { EventBus } from "../../core/EventBus";
import type { MapEventMap } from "./types";

export class MapEventManager {
  private readonly bus = new EventBus();
  private unsubscribers: Array<() => void> = [];

  on<K extends keyof MapEventMap>(
    event: K,
    handler: (payload: MapEventMap[K]) => void,
  ): () => void {
    const unsubscribe = this.bus.on(event, handler);
    this.unsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  emit<K extends keyof MapEventMap>(event: K, payload: MapEventMap[K]): void {
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

import { EventBus } from "../../core/EventBus";
import type { DevUIEventMap } from "./types";

export class DevUIEventManager {
  private readonly bus = new EventBus();

  on<K extends keyof DevUIEventMap>(
    event: K,
    handler: (payload: DevUIEventMap[K]) => void,
  ): () => void {
    return this.bus.on(event, handler);
  }

  emit<K extends keyof DevUIEventMap>(
    event: K,
    payload: DevUIEventMap[K],
  ): void {
    this.bus.emit(event, payload);
  }

  destroy(): void {
    this.bus.clear();
  }
}

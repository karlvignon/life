import { EventBus } from "../../core/EventBus";
import type { PlayerEventMap } from "./types";

export class PlayerEventManager {
  private readonly bus = new EventBus();

  on<K extends keyof PlayerEventMap>(
    event: K,
    handler: (payload: PlayerEventMap[K]) => void,
  ): () => void {
    return this.bus.on(event, handler);
  }

  emit<K extends keyof PlayerEventMap>(
    event: K,
    payload: PlayerEventMap[K],
  ): void {
    this.bus.emit(event, payload);
  }

  destroy(): void {
    this.bus.clear();
  }
}

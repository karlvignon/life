type Handler<T> = (payload: T) => void;

export class EventBus {
  private listeners = new Map<string, Set<Handler<unknown>>>();

  on<T>(event: string, handler: Handler<T>): () => void {
    let handlers = this.listeners.get(event);
    if (!handlers) {
      handlers = new Set();
      this.listeners.set(event, handlers);
    }

    handlers.add(handler as Handler<unknown>);

    return () => {
      handlers!.delete(handler as Handler<unknown>);
      if (handlers!.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  emit<T>(event: string, payload: T): void {
    const handlers = this.listeners.get(event);
    if (!handlers) {
      return;
    }

    for (const handler of handlers) {
      handler(payload);
    }
  }

  off<T>(event: string, handler: Handler<T>): void {
    const handlers = this.listeners.get(event);
    if (!handlers) {
      return;
    }

    handlers.delete(handler as Handler<unknown>);
    if (handlers.size === 0) {
      this.listeners.delete(event);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

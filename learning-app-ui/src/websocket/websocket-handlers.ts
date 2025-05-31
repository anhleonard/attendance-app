import { WebSocketMessage, WebSocketEventHandler, WebSocketEventHandlers } from "./websocket-types";

class WebSocketEventManager {
  private static instance: WebSocketEventManager;
  private handlers: WebSocketEventHandlers = {};

  private constructor() {}

  public static getInstance(): WebSocketEventManager {
    if (!WebSocketEventManager.instance) {
      WebSocketEventManager.instance = new WebSocketEventManager();
    }
    return WebSocketEventManager.instance;
  }

  public subscribe(eventType: string, handler: WebSocketEventHandler): () => void {
    if (!this.handlers[eventType]) {
      this.handlers[eventType] = [];
    }
    this.handlers[eventType].push(handler);

    // Return unsubscribe function
    return () => {
      this.handlers[eventType] = this.handlers[eventType].filter((h) => h !== handler);
    };
  }

  public emit(eventType: string, message: WebSocketMessage): void {
    const eventHandlers = this.handlers[eventType] || [];
    eventHandlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error(`Error in WebSocket event handler for ${eventType}:`, error);
      }
    });
  }

  public clearHandlers(): void {
    this.handlers = {};
  }
}

export const websocketEventManager = WebSocketEventManager.getInstance();

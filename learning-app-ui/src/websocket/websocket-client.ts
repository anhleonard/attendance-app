import { io } from "socket.io-client";
import { WebSocketState, WebSocketClientOptions, WebSocketEventData } from "./websocket-types";
import { websocketEventManager } from "./websocket-handlers";

class WebSocketClient {
  private static instance: WebSocketClient;
  private state: WebSocketState = {
    isConnected: false,
    lastError: null,
    reconnectAttempts: 0,
    socket: null,
  };
  private readonly baseUrl: string;
  private readonly options: WebSocketClientOptions;

  private constructor(baseUrl: string, options: WebSocketClientOptions = {}) {
    this.baseUrl = baseUrl;
    this.options = {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      ...options,
    };
  }

  public static getInstance(baseUrl: string, options?: WebSocketClientOptions): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient(baseUrl, options);
    }
    return WebSocketClient.instance;
  }

  public connect(): void {
    if (this.state.socket?.connected) {
      console.warn("Socket.IO is already connected");
      return;
    }

    try {
      this.state.socket = io(this.baseUrl, this.options);
      this.setupEventListeners();
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  private setupEventListeners(): void {
    if (!this.state.socket) return;

    this.state.socket.on("connect", () => {
      this.state.isConnected = true;
      this.state.reconnectAttempts = 0;
      this.state.lastError = null;

      websocketEventManager.emit("connect", {
        type: "connect",
        payload: null,
        timestamp: Date.now(),
      });
    });

    this.state.socket.on("disconnect", (reason: string) => {
      this.state.isConnected = false;
      websocketEventManager.emit("disconnect", {
        type: "disconnect",
        payload: { reason } as WebSocketEventData,
        timestamp: Date.now(),
      });
    });

    this.state.socket.on("connect_error", (error: Error) => {
      this.handleError(error);
    });

    this.state.socket.on("error", (error: Error) => {
      this.handleError(error);
    });

    this.state.socket.on("reconnect_attempt", (attemptNumber: number) => {
      this.state.reconnectAttempts = attemptNumber;
      websocketEventManager.emit("reconnect_attempt", {
        type: "reconnect_attempt",
        payload: { attempt: attemptNumber } as WebSocketEventData,
        timestamp: Date.now(),
      });
    });

    this.state.socket.on("reconnect", (attemptNumber: number) => {
      websocketEventManager.emit("reconnect", {
        type: "reconnect",
        payload: { attempt: attemptNumber } as WebSocketEventData,
        timestamp: Date.now(),
      });
    });

    this.state.socket.on("reconnect_error", (error: Error) => {
      this.handleError(error);
    });

    this.state.socket.on("reconnect_failed", () => {
      websocketEventManager.emit("reconnect_failed", {
        type: "reconnect_failed",
        payload: "Max reconnection attempts reached",
        timestamp: Date.now(),
      });
    });
  }

  private handleError(error: Error): void {
    this.state.lastError = error.message;
    websocketEventManager.emit("error", {
      type: "error",
      payload: error.message,
      timestamp: Date.now(),
    });
  }

  public emit(event: string, data: unknown): void {
    if (!this.state.socket?.connected) {
      throw new Error("Socket.IO is not connected");
    }

    try {
      this.state.socket.emit(event, data);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  public on(event: string, callback: (data: unknown) => void): void {
    if (!this.state.socket) {
      throw new Error("Socket.IO is not initialized");
    }

    this.state.socket.on(event, callback);
  }

  public off(event: string, callback?: (data: unknown) => void): void {
    if (!this.state.socket) return;

    if (callback) {
      this.state.socket.off(event, callback);
    } else {
      this.state.socket.off(event);
    }
  }

  public disconnect(): void {
    if (this.state.socket) {
      this.state.socket.disconnect();
      this.state.socket = null;
    }

    this.state = {
      isConnected: false,
      lastError: null,
      reconnectAttempts: 0,
      socket: null,
    };
  }

  public getState(): WebSocketState {
    return { ...this.state };
  }
}

// Export a function to initialize the Socket.IO client
export const initializeWebSocket = (baseUrl: string, options?: WebSocketClientOptions) => {
  return WebSocketClient.getInstance(baseUrl, options);
};

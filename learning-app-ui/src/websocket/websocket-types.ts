import { Socket, SocketOptions } from "socket.io-client";

export type WebSocketMessage = {
  type: string;
  payload: unknown;
  timestamp: number;
};

export type WebSocketEventType =
  | "connect"
  | "disconnect"
  | "error"
  | "connect_error"
  | "reconnect"
  | "reconnect_attempt"
  | "reconnect_error"
  | "reconnect_failed";

export type WebSocketState = {
  isConnected: boolean;
  lastError: string | null;
  reconnectAttempts: number;
  socket: Socket | null;
};

export type WebSocketEventHandler = (message: WebSocketMessage) => void;

export type WebSocketEventHandlers = {
  [key: string]: WebSocketEventHandler[];
};

export type WebSocketClientOptions = SocketOptions & {
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
};

export type WebSocketEventData = {
  reason?: string;
  attempt?: number;
  error?: string;
};

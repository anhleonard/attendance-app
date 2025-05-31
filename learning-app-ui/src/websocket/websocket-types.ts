import { Socket } from "socket.io-client";

export type WebSocketMessage = {
  type: string;
  payload: any;
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

import { config } from '../config';
import { createWebSocketClient } from './webSocketClient';

export function createRealtimeClient() {
  return createWebSocketClient({ url: config.wsUrl });
}


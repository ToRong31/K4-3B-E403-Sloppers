import { config } from '../config';
import { createMockRealtimeClient } from './mockRealtimeClient';
import { createWebSocketClient } from './webSocketClient';

export function createRealtimeClient() {
  return config.isMock
    ? createMockRealtimeClient()
    : createWebSocketClient({ url: config.wsUrl });
}


import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createWebSocketClient } from './webSocketClient';

class FakeWebSocket {
  static OPEN = 1;
  static instances = [];

  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.listeners = new Map();
    this.sent = [];
    FakeWebSocket.instances.push(this);
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  emit(type, payload = {}) {
    for (const listener of this.listeners.get(type) ?? []) listener(payload);
  }

  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.emit('open');
  }

  message(payload) {
    this.emit('message', { data: JSON.stringify(payload) });
  }

  send(payload) {
    this.sent.push(JSON.parse(payload));
  }

  close() {
    this.readyState = 3;
    this.emit('close');
  }
}

const event = (overrides = {}) => ({
  event_id: 'event-1',
  type: 'task.updated',
  scope_id: 'group-1',
  entity_id: 'task-1',
  version: 2,
  occurred_at: '2026-09-18T10:00:00Z',
  payload: { status: 'done' },
  ...overrides,
});

describe('createWebSocketClient', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal('WebSocket', FakeWebSocket);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('deduplicates event_id and rejects stale entity versions', async () => {
    const client = createWebSocketClient({ url: 'ws://test/realtime' });
    const received = [];
    client.subscribe((payload) => received.push(payload));
    const connected = client.connect();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    await connected;

    socket.message(event());
    socket.message(event());
    socket.message(event({ event_id: 'event-old', version: 1 }));
    socket.message(event({ event_id: 'event-new', version: 3 }));

    expect(received.map((item) => item.event_id)).toEqual(['event-1', 'event-new']);
    client.disconnect();
  });

  it('requests a snapshot resync after reconnect', async () => {
    vi.useFakeTimers();
    const client = createWebSocketClient({ url: 'ws://test/realtime' });
    const connected = client.connect();
    FakeWebSocket.instances[0].open();
    await connected;
    FakeWebSocket.instances[0].message(event());
    FakeWebSocket.instances[0].close();

    await vi.advanceTimersByTimeAsync(1300);
    const reconnected = FakeWebSocket.instances[1];
    reconnected.open();

    expect(reconnected.sent).toEqual([
      { type: 'resync', after: '2026-09-18T10:00:00Z' },
    ]);
    client.disconnect();
  });
});

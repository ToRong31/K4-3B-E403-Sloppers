const CHANNEL_NAME = 'vlearn-labspace.mock-events';

export function createMockRealtimeClient() {
  let channel = null;
  const listeners = new Set();

  return {
    source: 'mock',
    connect() {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel(CHANNEL_NAME);
        channel.addEventListener('message', (event) => {
          listeners.forEach((listener) => listener(event.data));
        });
      }
      return Promise.resolve({ status: 'connected' });
    },
    disconnect() {
      channel?.close();
      channel = null;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    publish(event) {
      const envelope = {
        event_id: crypto.randomUUID(),
        occurred_at: new Date().toISOString(),
        version: 1,
        ...event,
      };
      channel?.postMessage(envelope);
      listeners.forEach((listener) => listener(envelope));
    },
  };
}


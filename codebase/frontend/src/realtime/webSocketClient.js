import { isRealtimeEnvelope } from '../api/contracts';

export function createWebSocketClient({ url }) {
  let socket = null;
  let reconnectTimer = null;
  let reconnectAttempt = 0;
  let closedByUser = false;
  const listeners = new Set();
  const statusListeners = new Set();

  const notifyStatus = (status) => {
    statusListeners.forEach((listener) => listener(status));
  };

  const openSocket = () =>
    new Promise((resolve, reject) => {
      notifyStatus(reconnectAttempt ? 'reconnecting' : 'connecting');
      socket = new WebSocket(url);
      socket.addEventListener('open', () => {
        reconnectAttempt = 0;
        notifyStatus('connected');
        resolve({ status: 'connected' });
      });
      socket.addEventListener('message', (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (isRealtimeEnvelope(payload)) {
            listeners.forEach((listener) => listener(payload));
          }
        } catch {
          // Invalid events are ignored
        }
      });
      socket.addEventListener('error', () => {
        notifyStatus('offline');
        resolve({ status: 'offline' });
      });
      socket.addEventListener('close', () => {
        notifyStatus('offline');
        if (closedByUser) return;
        reconnectAttempt += 1;
        const delay = Math.min(1000 * 2 ** reconnectAttempt, 15000);
        reconnectTimer = window.setTimeout(() => openSocket().catch(() => undefined), delay);
      });
    });

  return {
    source: 'websocket',
    connect() {
      closedByUser = false;
      return openSocket();
    },
    disconnect() {
      closedByUser = true;
      window.clearTimeout(reconnectTimer);
      socket?.close();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    subscribeStatus(listener) {
      statusListeners.add(listener);
      return () => statusListeners.delete(listener);
    },
    publish(event) {
      const envelope = isRealtimeEnvelope(event)
        ? event
        : {
            event_id: crypto.randomUUID?.() ?? `evt-${Date.now()}`,
            occurred_at: new Date().toISOString(),
            version: 1,
            scope_id: 'group-sloppers',
            ...event,
          };
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(envelope));
      } else {
        listeners.forEach((listener) => listener(envelope));
      }
    },
  };
}

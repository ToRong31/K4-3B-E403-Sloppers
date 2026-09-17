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
          // Invalid events are ignored; server/client contract tests should catch them.
        }
      });
      socket.addEventListener('error', () => reject(new Error('Không thể kết nối realtime.')));
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
      if (socket?.readyState !== WebSocket.OPEN) {
        throw new Error('Realtime chưa kết nối.');
      }
      socket.send(JSON.stringify(event));
    },
  };
}

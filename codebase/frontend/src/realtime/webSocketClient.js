import { isRealtimeEnvelope } from '../api/contracts';

export function createWebSocketClient({ url }) {
  let socket = null;
  let reconnectTimer = null;
  let reconnectAttempt = 0;
  let closedByUser = false;
  let hasConnected = false;
  let lastOccurredAt = null;
  const listeners = new Set();
  const statusListeners = new Set();
  const seenEventIds = new Set();
  const entityVersions = new Map();

  const notifyStatus = (status) => statusListeners.forEach((listener) => listener(status));

  const rememberEvent = (event) => {
    if (seenEventIds.has(event.event_id)) return false;
    const entityKey = `${event.scope_id}:${event.entity_id}`;
    const currentVersion = entityVersions.get(entityKey) ?? -1;
    if (event.type !== 'snapshot' && event.version <= currentVersion) return false;
    seenEventIds.add(event.event_id);
    if (seenEventIds.size > 1000) seenEventIds.delete(seenEventIds.values().next().value);
    if (event.type !== 'snapshot') entityVersions.set(entityKey, event.version);
    if (!lastOccurredAt || event.occurred_at > lastOccurredAt) lastOccurredAt = event.occurred_at;
    return true;
  };

  const openSocket = () =>
    new Promise((resolve) => {
      notifyStatus(hasConnected ? 'reconnecting' : 'connecting');
      socket = new WebSocket(url);
      socket.addEventListener('open', () => {
        const reconnecting = hasConnected;
        hasConnected = true;
        reconnectAttempt = 0;
        notifyStatus('connected');
        if (reconnecting) {
          socket.send(JSON.stringify({ type: 'resync', after: lastOccurredAt }));
        }
        resolve({ status: 'connected' });
      });
      socket.addEventListener('message', (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (isRealtimeEnvelope(payload) && rememberEvent(payload)) {
            listeners.forEach((listener) => listener(payload));
          }
        } catch {
          // Malformed/unrecognized events never mutate application state.
        }
      });
      socket.addEventListener('error', () => notifyStatus('offline'));
      socket.addEventListener('close', () => {
        notifyStatus('offline');
        if (closedByUser) return;
        reconnectAttempt += 1;
        const delay = Math.min(500 * 2 ** reconnectAttempt, 15000) + Math.floor(Math.random() * 250);
        reconnectTimer = globalThis.setTimeout(() => openSocket(), delay);
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
      globalThis.clearTimeout(reconnectTimer);
      socket?.close();
      socket = null;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    subscribeStatus(listener) {
      statusListeners.add(listener);
      return () => statusListeners.delete(listener);
    },
    publish(message) {
      if (socket?.readyState !== WebSocket.OPEN) throw new Error('Realtime connection is offline.');
      socket.send(JSON.stringify(message));
    },
    resync() {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'resync', after: lastOccurredAt }));
      }
    },
  };
}

const dataSource = import.meta.env.VITE_DATA_SOURCE ?? 'http';

export const config = Object.freeze({
  dataSource,
  isMock: dataSource === 'mock',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1',
  wsUrl: import.meta.env.VITE_WS_URL ?? 'ws://127.0.0.1:8000/api/v1/realtime',
});


const dataSource = import.meta.env.VITE_DATA_SOURCE ?? 'mock';

const browserOrigin = typeof window === 'undefined' ? 'http://127.0.0.1:8000' : window.location.origin;
const browserWebSocketOrigin = browserOrigin.replace(/^http/, 'ws');
const configuredWsUrl = import.meta.env.VITE_WS_URL;

export const config = Object.freeze({
  dataSource,
  isMock: dataSource === 'mock',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? `${browserOrigin}/api/v1`,
  wsUrl:
    !configuredWsUrl || configuredWsUrl === 'auto'
      ? `${browserWebSocketOrigin}/api/v1/realtime`
      : configuredWsUrl,
});

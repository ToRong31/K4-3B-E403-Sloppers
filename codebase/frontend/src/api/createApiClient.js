import { config } from '../config';
import { createHttpApiClient } from './httpApiClient';
import { createMockApiClient } from './mockApiClient';

const httpApiClient = createHttpApiClient({ baseUrl: config.apiBaseUrl });
const mockApiClient = createMockApiClient();

// The workspace fixture is intentionally kept in mock mode until the group and
// auth APIs exist. Assignment generation is already backed by FastAPI, so it
// must not silently fall back to a fabricated proposal in that mode.
export const apiClient = config.isMock
  ? { ...mockApiClient, assignTasks: httpApiClient.assignTasks }
  : httpApiClient;


import { config } from '../config';
import { createHttpApiClient } from './httpApiClient';
import { createMockApiClient } from './mockApiClient';

const httpApiClient = createHttpApiClient({ baseUrl: config.apiBaseUrl });
const mockApiClient = createMockApiClient({ baseUrl: config.apiBaseUrl });

// The workspace fixture is intentionally kept in mock mode until the group and
// auth APIs exist. Task analysis and assignment generation are backed by FastAPI & LLM,
// so they call the real backend endpoints.
export const apiClient = config.isMock
  ? {
      ...mockApiClient,
      assignTasks: httpApiClient.assignTasks,
      analyzeLab: httpApiClient.analyzeLab,
    }
  : httpApiClient;

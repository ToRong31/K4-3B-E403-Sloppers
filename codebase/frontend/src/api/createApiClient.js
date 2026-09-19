import { config } from '../config';
import { createHttpApiClient } from './httpApiClient';
import { createMockApiClient } from './mockApiClient';

const httpApiClient = createHttpApiClient({ baseUrl: config.apiBaseUrl });
const mockApiClient = createMockApiClient({ baseUrl: config.apiBaseUrl });

// Mock mode stays available for isolated UI work. HTTP is the deployment default.
export const apiClient = config.isMock
  ? {
      ...mockApiClient,
      assignTasks: httpApiClient.assignTasks,
      analyzeLab: httpApiClient.analyzeLab,
    }
  : httpApiClient;

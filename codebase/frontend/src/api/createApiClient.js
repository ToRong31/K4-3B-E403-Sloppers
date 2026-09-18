import { config } from '../config';
import { createHttpApiClient } from './httpApiClient';
import { createMockApiClient } from './mockApiClient';

export const apiClient = config.isMock
  ? createMockApiClient()
  : createHttpApiClient({ baseUrl: config.apiBaseUrl });


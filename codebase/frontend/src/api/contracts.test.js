import { describe, expect, it } from 'vitest';

import { isRealtimeEnvelope } from './contracts';

describe('realtime event contract', () => {
  it('accepts a versioned domain event', () => {
    expect(
      isRealtimeEnvelope({
        event_id: 'event-1',
        type: 'task.updated',
        scope_id: 'group-1',
        version: 3,
        occurred_at: '2026-09-18T00:00:00Z',
        payload: { task_id: 'task-1' },
      }),
    ).toBe(true);
  });

  it('rejects unknown event types', () => {
    expect(
      isRealtimeEnvelope({
        event_id: 'event-2',
        type: 'member.secret_leaked',
        scope_id: 'class-e403',
        version: 1,
        occurred_at: '2026-09-18T00:00:00Z',
        payload: {},
      }),
    ).toBe(false);
  });
});


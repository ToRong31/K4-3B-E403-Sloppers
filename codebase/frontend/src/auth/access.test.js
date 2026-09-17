import { describe, expect, it } from 'vitest';

import { canAccess, ROLE_HOME } from './access';

describe('role access', () => {
  it('routes coaches to the coach dashboard', () => {
    expect(ROLE_HOME.coach).toBe('/coach');
  });

  it('blocks members from coach-only routes', () => {
    expect(canAccess('member', ['coach'])).toBe(false);
    expect(canAccess('coach', ['coach'])).toBe(true);
  });
});


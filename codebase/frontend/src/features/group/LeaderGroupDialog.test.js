import { describe, expect, it } from 'vitest';

import { buildDemoGroupCode, resolveInviteSlot } from './LeaderGroupDialog';

const directory = [
  { studentCode: '2A202602678', fullName: 'Lê Thị Thùy Trang' },
  { studentCode: '2A202602676', fullName: 'Lâm Hải Dương' },
];

describe('leader group invitation validation', () => {
  it('resolves a known student code without depending on letter case', () => {
    const result = resolveInviteSlot('2a202602678', directory, '2A202602765', ['2a202602678']);

    expect(result.status).toBe('matched');
    expect(result.student.fullName).toBe('Lê Thị Thùy Trang');
  });

  it('rejects the leader, duplicate codes and unknown students', () => {
    expect(resolveInviteSlot('2A202602765', directory, '2A202602765').status).toBe('self');
    expect(resolveInviteSlot('2A202602678', directory, '2A202602765', ['2A202602678', '2a202602678']).status).toBe('duplicate');
    expect(resolveInviteSlot('2A000000000', directory, '2A202602765').status).toBe('not-found');
  });

  it('builds a stable demo group code from the group name', () => {
    expect(buildDemoGroupCode('Sloppers')).toBe('SLOP-3B');
    expect(buildDemoGroupCode('Đội Ánh Dương')).toBe('DOIA-3B');
  });
});

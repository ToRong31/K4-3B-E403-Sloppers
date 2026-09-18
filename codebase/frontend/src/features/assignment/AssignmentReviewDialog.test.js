import { describe, expect, it } from 'vitest';

import { buildDraftAssignments, calculateWorkload } from './AssignmentReviewDialog';

const tasks = [
  { id: 't1', title: 'Evidence', category: 'EVIDENCE', owner: 'Trọng' },
  { id: 't3', title: 'Mockup', category: 'UI / FLOW', owner: 'Trang' },
  { id: 't4', title: 'Golden set', category: 'AI / EVAL', owner: 'Dương' },
];

describe('AI assignment review UI helpers', () => {
  it('creates a proposal while preserving every task identity', () => {
    const draft = buildDraftAssignments(tasks);

    expect(draft.map((item) => item.taskId)).toEqual(['t1', 't3', 't4']);
    expect(draft.find((item) => item.taskId === 't3')).toMatchObject({ owner: 'Trang', confidence: 96 });
  });

  it('counts assignment workload after the leader changes an owner', () => {
    expect(calculateWorkload([
      { owner: 'Trọng' },
      { owner: 'Trang' },
      { owner: 'Trang' },
      { owner: 'Cả nhóm' },
    ])).toEqual({ Trọng: 1, Trang: 2, 'Cả nhóm': 1 });
  });
});

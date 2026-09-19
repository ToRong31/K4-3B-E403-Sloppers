import { describe, expect, it } from 'vitest';

import { buildDraftAssignments, calculateWorkload, isAssignmentDraftApprovable } from './AssignmentReviewDialog';

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

  it('uses draft task metadata when the workspace has no plan tasks yet', () => {
    const draft = buildDraftAssignments([], [{
      task_id: 'canonical-1',
      title: 'Chốt nhân sự và chọn track đề tài',
      category: 'PREPARE',
      owner_id: 'member-1',
      reason: 'Khớp kỹ năng',
      confidence: 'high',
      reference_ids: ['lab://prepare/team-track'],
    }], [{ id: 'member-1', name: 'Trọng' }]);

    expect(draft[0]).toMatchObject({
      title: 'Chốt nhân sự và chọn track đề tài',
      category: 'PREPARE',
      taskId: 'canonical-1',
    });
  });

  it('allows a READY draft even when the hydrated task list is incomplete', () => {
    expect(isAssignmentDraftApprovable({
      draftLoading: false,
      draftStatus: 'ready',
      draftError: '',
      assignments: [{ taskId: 'canonical-1', owner: 'Trọng' }],
    })).toBe(true);
  });

  it('keeps approval disabled until the draft is ready and non-empty', () => {
    expect(isAssignmentDraftApprovable({
      draftLoading: false,
      draftStatus: 'clarify',
      draftError: '',
      assignments: [{ taskId: 'canonical-1', owner: 'Trọng' }],
    })).toBe(false);
    expect(isAssignmentDraftApprovable({
      draftLoading: false,
      draftStatus: 'ready',
      draftError: '',
      assignments: [],
    })).toBe(false);
  });
});

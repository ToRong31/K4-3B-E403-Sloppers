import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CoachHelpDialog } from './CoachHelpDialog';
import { CoachResponseDialog } from './CoachResponseDialog';

describe('Coach Help & Response Dialogs', () => {
  const dummyGroup = { id: 'g-test-1', name: 'Sloppers', code: 'SLOP-3B' };
  const dummyUser = {
    displayName: 'Phạm Hoàng Trọng',
    shortName: 'Trọng',
    role: 'leader',
    roleLabel: 'Nhóm trưởng',
    accountId: '21010001',
  };

  it('does not render when open is false', () => {
    const html = renderToStaticMarkup(
      <CoachHelpDialog
        open={false}
        onClose={() => {}}
        group={dummyGroup}
        user={dummyUser}
      />
    );
    expect(html).toBe('');
  });

  it('renders CoachHelpDialog with group info, question textarea and topic options', () => {
    const html = renderToStaticMarkup(
      <CoachHelpDialog
        open={true}
        onClose={() => {}}
        group={dummyGroup}
        user={dummyUser}
      />
    );

    expect(html).toContain('Gửi yêu cầu hỗ trợ tới Lab Coach');
    expect(html).toContain('Nhóm Sloppers (Mã nhóm: SLOP-3B)');
    expect(html).toContain('Người gửi: Phạm Hoàng Trọng (Nhóm trưởng)');
    expect(html).toContain('Chủ đề cần Coach hướng dẫn / giải đáp:');
    expect(html).toContain('Nội dung câu hỏi hoặc vấn đề nhóm đang gặp phải:');
    expect(html).toContain('Vướng Golden Set CP3');
    expect(html).toContain('Task CP2 bị Blocked');
    expect(html).toContain('🚀 Gửi yêu cầu tới Coach');
  });

  it('renders existing support request and coach reply when provided', () => {
    const requests = [
      {
        id: 'req-1',
        topic: 'Checkpoint 3: Golden Set Benchmark & Prompt (CP3)',
        question: 'Nhóm em cần Coach review trước bản nháp',
        status: 'resolved',
        createdAt: '2026-09-19T01:00:00Z',
        replies: [
          {
            id: 'rep-1',
            message: 'Coach đã xem bộ test 20 prompt, các bạn bổ sung thêm 5 prompt edge cases nhé.',
            createdAt: '2026-09-19T01:10:00Z',
          },
        ],
      },
    ];

    const html = renderToStaticMarkup(
      <CoachHelpDialog
        open={true}
        onClose={() => {}}
        group={dummyGroup}
        user={dummyUser}
        supportRequests={requests}
      />
    );

    expect(html).toContain('✓ Coach đã giải đáp');
    expect(html).toContain('Nhóm em cần Coach review trước bản nháp');
    expect(html).toContain('Phản hồi từ Lab Coach:');
    expect(html).toContain('Coach đã xem bộ test 20 prompt');
  });

  it('renders CoachResponseDialog for coach with question and reply form', () => {
    const request = {
      id: 'req-pending-1',
      topic: 'Kỹ thuật: Kết nối API',
      question: 'Nhóm bị lỗi CORS khi gọi API backend',
      status: 'pending',
      urgent: true,
      sender: { name: 'Trang' },
    };

    const html = renderToStaticMarkup(
      <CoachResponseDialog
        open={true}
        onClose={() => {}}
        group={dummyGroup}
        request={request}
      />
    );

    expect(html).toContain('LAB COACH · PHIÊN HỖ TRỢ NHÓM LAB');
    expect(html).toContain('Yêu cầu hỗ trợ — Sloppers (SLOP-3B)');
    expect(html).toContain('Nhóm bị lỗi CORS khi gọi API backend');
    expect(html).toContain('⏳ Chờ giải đáp');
    expect(html).toContain('✓ Giải đáp &amp; Hoàn thành');
  });
});

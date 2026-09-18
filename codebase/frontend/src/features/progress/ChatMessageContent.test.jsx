import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { ChatMessageContent } from './ChatMessageContent';

describe('ChatMessageContent', () => {
  it('renders bold and lists properly without raw asterisks', () => {
    const rawMarkdown = `Dưới đây là tóm tắt các mục tiêu:

1. **Chuẩn bị đội ngũ**:
Chọn thành viên trong nhóm và tạo repo.

2. **Khám phá bài toán**:
Thu thập bằng chứng và nộp form CP1.`;

    const html = renderToStaticMarkup(<ChatMessageContent content={rawMarkdown} />);

    expect(html).not.toContain('**');
    expect(html).toContain('<strong>Chuẩn bị đội ngũ</strong>');
    expect(html).toContain('<li class="chat-list-item">');
    expect(html).toContain('chat-item-header');
    expect(html).toContain('chat-item-body');
  });

  it('renders inline code and paragraphs', () => {
    const raw = 'Xem file `spec.md` để biết thêm chi tiết.';
    const html = renderToStaticMarkup(<ChatMessageContent content={raw} />);
    expect(html).toContain('<code class="chat-inline-code">spec.md</code>');
  });
});

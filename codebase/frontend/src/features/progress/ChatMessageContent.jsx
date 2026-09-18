import React from 'react';

function parseInline(text) {
  if (!text) return null;
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
      return <code key={i} className="chat-inline-code">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 3) {
      return <strong key={i}>{parseInline(part.slice(2, -2))}</strong>;
    }
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length > 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length > 2)
    ) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="chat-link"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}

export function ChatMessageContent({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const blocks = [];
  let currentList = null;
  let currentParagraph = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        blocks.push({ type: 'p', content: text });
      }
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList && currentList.items.length > 0) {
      blocks.push(currentList);
      currentList = null;
    }
  };

  let inCodeBlock = false;
  let codeBlockLines = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({ type: 'code', content: codeBlockLines.join('\n') });
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        flushParagraph();
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[2]);
      continue;
    }

    const ulMatch = trimmed.match(/^[-*+]\s+(.*)$/);
    if (ulMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[1]);
      continue;
    }

    if (currentList && currentList.items.length > 0) {
      const lastIdx = currentList.items.length - 1;
      currentList.items[lastIdx] += '\n' + trimmed;
      continue;
    }

    flushList();
    currentParagraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  if (codeBlockLines.length > 0) {
    blocks.push({ type: 'code', content: codeBlockLines.join('\n') });
  }

  return (
    <div className="chat-markdown-body">
      {blocks.map((block, idx) => {
        if (block.type === 'p') {
          return <p key={idx}>{parseInline(block.content)}</p>;
        }
        if (block.type === 'ol') {
          return (
            <ol key={idx} className="chat-ordered-list">
              {block.items.map((item, itemIdx) => {
                const subLines = item.split('\n');
                return (
                  <li key={itemIdx} className="chat-list-item">
                    {subLines.map((sub, sIdx) => (
                      <span
                        key={sIdx}
                        className={sIdx === 0 ? 'chat-item-header' : 'chat-item-body'}
                      >
                        {parseInline(sub)}
                      </span>
                    ))}
                  </li>
                );
              })}
            </ol>
          );
        }
        if (block.type === 'ul') {
          return (
            <ul key={idx} className="chat-unordered-list">
              {block.items.map((item, itemIdx) => {
                const subLines = item.split('\n');
                return (
                  <li key={itemIdx} className="chat-list-item">
                    {subLines.map((sub, sIdx) => (
                      <span
                        key={sIdx}
                        className={sIdx === 0 ? 'chat-item-header' : 'chat-item-body'}
                      >
                        {parseInline(sub)}
                      </span>
                    ))}
                  </li>
                );
              })}
            </ul>
          );
        }
        if (block.type === 'code') {
          return (
            <pre key={idx} className="chat-code-block">
              <code>{block.content}</code>
            </pre>
          );
        }
        return null;
      })}
    </div>
  );
}

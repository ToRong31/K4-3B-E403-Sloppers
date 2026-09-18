import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { apiClient } from '../../api/createApiClient';
import { createGroupChatDemoMessages, createProgressChatDemoReply } from './progressChatDemo';

const quickQuestions = [
  { label: '📌 Tôi cần làm gì?', question: 'Tôi cần làm gì?' },
  { label: '🚀 Task này làm thế nào?', question: 'Task này cần làm như thế nào?' },
  { label: '🎯 Nhóm còn bao nhiêu việc?', question: 'Nhóm còn bao nhiêu việc?' },
];

function initialAssistantMessage(isMock) {
  return {
    id: 'welcome',
    role: 'assistant',
    answer: 'Chào bạn! Mình là Trợ lý Lab AI 1:1. Mình có thể giải thích task của riêng bạn hoặc tóm tắt tiến độ nhóm, nhưng không tự đổi owner hay trạng thái task.',
    reference_ids: [],
    isMock,
  };
}

function SourceReferences({ references }) {
  if (!references?.length) return null;
  return (
    <div className="ai-chat-references" aria-label="Nguồn bài Lab">
      {references.map((reference) => <span key={reference}>⌁ {reference}</span>)}
    </div>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

export function PrivateProgressChat({ snapshot, user, isMock }) {
  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('ai');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState(() => [initialAssistantMessage(isMock)]);
  const [isResponding, setIsResponding] = useState(false);
  const inputRef = useRef(null);
  const panelLabelId = useId();
  const ownTasks = useMemo(
    () => snapshot.tasks.filter((task) => task.owner === user.shortName),
    [snapshot.tasks, user.shortName],
  );
  const selectedTaskId = ownTasks[0]?.id ?? '';
  const groupMessages = useMemo(
    () => createGroupChatDemoMessages({ members: snapshot.members, tasks: snapshot.tasks, user }),
    [snapshot.members, snapshot.tasks, user],
  );

  useEffect(() => {
    document.body.classList.toggle('chat-sidebar-open', open);
    return () => document.body.classList.remove('chat-sidebar-open');
  }, [open]);

  const openSidebar = () => {
    setOpen(true);
    window.requestAnimationFrame(() => {
      if (activeTab === 'ai') inputRef.current?.focus();
    });
  };

  const selectTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'ai') window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const sendQuestion = async (rawQuestion) => {
    const submittedQuestion = rawQuestion.trim();
    if (!submittedQuestion || isResponding) return;

    setMessages((current) => [...current, {
      id: `user-${Date.now()}`,
      role: 'user',
      answer: submittedQuestion,
    }]);
    setQuestion('');
    setIsResponding(true);

    try {
      let reply = null;
      if (apiClient.sendChatMessage) {
        reply = await apiClient.sendChatMessage({
          message: submittedQuestion,
          user_id: user.shortName || user.name || user.accountId,
          group_id: snapshot.group?.id || 'Nhom-03',
          task_id: selectedTaskId || undefined,
        });
      }
      if (!reply) {
        reply = createProgressChatDemoReply({
          question: submittedQuestion,
          taskId: selectedTaskId,
          tasks: snapshot.tasks,
          user,
        });
      }

      setMessages((current) => [...current, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        ...reply,
        isMock,
      }]);
    } catch (err) {
      console.error('Chat API error:', err);
      const fallbackReply = createProgressChatDemoReply({
        question: submittedQuestion,
        taskId: selectedTaskId,
        tasks: snapshot.tasks,
        user,
      });
      setMessages((current) => [...current, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        ...fallbackReply,
        isMock,
      }]);
    } finally {
      setIsResponding(false);
    }
  };

  const resetConversation = () => {
    setMessages([initialAssistantMessage(isMock)]);
    setQuestion('');
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <>
      <aside
        className={`chat-sidebar ${open ? '' : 'collapsed'}`}
        aria-labelledby={panelLabelId}
        aria-hidden={!open}
      >
        <h2 className="sr-only" id={panelLabelId}>Kênh nhóm và Trợ lý Lab AI</h2>
        <button
          type="button"
          className="sidebar-outer-collapse-btn"
          title="Thu gọn khung chat"
          aria-label="Thu gọn khung chat"
          onClick={() => setOpen(false)}
        >
          <span aria-hidden="true">›│</span>
        </button>

        <div className="sidebar-header">
          <div className="chat-tab-switcher" role="tablist" aria-label="Chọn kênh chat">
            <button
              type="button"
              className={`chat-tab-nav ${activeTab === 'group' ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'group'}
              onClick={() => selectTab('group')}
            >
              <span aria-hidden="true">👥</span>
              <span>Kênh nhóm</span>
              <span className="tab-channel-sub">#{snapshot.group.name.toLocaleLowerCase('vi-VN')}</span>
            </button>
            <button
              type="button"
              className={`chat-tab-nav ${activeTab === 'ai' ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'ai'}
              onClick={() => selectTab('ai')}
            >
              <span aria-hidden="true">🤖</span>
              <span>Trợ lý Lab AI</span>
              <span className="ai-live-badge">1:1</span>
            </button>
          </div>
        </div>

        <section className={`chat-tab-content ${activeTab === 'group' ? 'active' : ''}`} role="tabpanel">
          <div className="group-channel-bar">
            <div className="group-channel-meta">
              <span className="online-pill">● {snapshot.members.length} thành viên</span>
              <span className="bot-present-pill">🤖 AI trong nhóm</span>
            </div>
            <button className="group-ai-summary-btn" type="button" disabled title="Sẽ nối backend ở task chat nhóm">✨ AI tóm tắt</button>
          </div>
          {isMock && <div className="chat-identity-banner"><strong>Dữ liệu demo</strong> · Kênh nhóm chưa nối backend realtime</div>}
          <div className="chat-messages" aria-live="polite">
            {groupMessages.map((message) => (
              <article className={`chat-msg-row ${message.mine ? 'mine' : 'peer'}`} key={message.id}>
                <span className={`chat-msg-avatar ${message.isLeader ? 'leader' : 'member'}`} aria-hidden="true">{message.initial}</span>
                <div className="chat-msg-content">
                  <div className="chat-msg-meta">
                    <span className="author-name">{message.mine ? 'Bạn' : message.author}</span>
                    <span className="author-role-tag">{message.role}</span>
                    <span>{message.time}</span>
                  </div>
                  <div className="chat-msg-bubble">{message.text}</div>
                </div>
              </article>
            ))}
          </div>
          <div className="chat-footer">
            <div className="chat-input-toolbar">
              <button className="chat-tool-btn" type="button" disabled>📎 File</button>
              <button className="chat-tool-btn" type="button" disabled>📑 Tài liệu Lab</button>
              <button className="chat-tool-btn ai-mention-btn" type="button" disabled>🤖 @Trợ lý AI</button>
            </div>
            <div className="chat-input-form">
              <input className="chat-input" placeholder="Chat nhóm sẽ được nối ở task riêng..." disabled />
              <button className="chat-send-btn" type="button" disabled aria-label="Gửi tin nhắn nhóm"><SendIcon /></button>
            </div>
          </div>
        </section>

        <section className={`chat-tab-content ${activeTab === 'ai' ? 'active' : ''}`} role="tabpanel">
          <div className="ai-assistant-header-bar">
            <div className="ai-mentor-profile">
              <div className="ai-mentor-avatar" aria-hidden="true">🤖</div>
              <div className="ai-mentor-info">
                <strong>Trợ lý Lab AI · Mentor</strong>
                <small>Cố vấn riêng cho bài Mini Hackathon</small>
              </div>
            </div>
            <button type="button" className="ai-clear-btn" onClick={resetConversation} title="Làm mới cuộc trò chuyện">↻ Mới</button>
          </div>

          {isMock && <div className="chat-identity-banner"><strong>Dữ liệu demo</strong> · Chưa đồng bộ Progress Chat backend</div>}

          <div className="ai-quick-prompts-tray">
            <div className="quick-prompts-label">Gợi ý câu hỏi bài Lab 1-chạm:</div>
            <div className="quick-prompts-scroll" aria-label="Câu hỏi gợi ý">
              {quickQuestions.map(({ label, question: prompt }) => (
                <button className="ai-quick-chip" key={prompt} type="button" onClick={() => sendQuestion(prompt)}>{label}</button>
              ))}
            </div>
          </div>

          <div className="ai-chat-messages" aria-live="polite">
            {messages.map((message) => (
              <article className={`ai-chat-row ${message.role}`} key={message.id}>
                <div className="ai-chat-meta">
                  {message.role === 'user' ? 'Bạn' : 'Trợ lý Lab AI'}
                  {message.status === 'clarify' ? ' · Cần làm rõ' : ''}
                </div>
                <div className={message.role === 'user' ? 'ai-user-bubble' : 'ai-bot-bubble'}>
                  <p>{message.answer}</p>
                  <SourceReferences references={message.reference_ids} />
                  {message.suggested_next_action && <em>→ {message.suggested_next_action}</em>}
                </div>
              </article>
            ))}
            {isResponding && (
              <div className="ai-chat-typing" aria-label="Trợ lý đang trả lời"><i /><i /><i /></div>
            )}
          </div>

          <div className="ai-chat-footer">
            <form className="chat-input-form" onSubmit={(event) => { event.preventDefault(); sendQuestion(question); }}>
              <label className="sr-only" htmlFor="private-progress-question">Hỏi Trợ lý Lab AI</label>
              <input
                ref={inputRef}
                id="private-progress-question"
                className="chat-input"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Hỏi Trợ lý AI về task, checklist, tiến độ..."
                autoComplete="off"
              />
              <button className="ai-send-btn" type="submit" disabled={!question.trim() || isResponding} aria-label="Hỏi Trợ lý Lab AI"><SendIcon /></button>
            </form>
          </div>
        </section>
      </aside>

      <button
        type="button"
        className={`chat-expand-rail ${open ? '' : 'visible'}`}
        title="Mở kênh chat nhóm và Trợ lý AI"
        aria-label="Mở kênh chat nhóm và Trợ lý AI"
        aria-expanded={open}
        onClick={openSidebar}
      >
        <span className="rail-icon" aria-hidden="true">💬</span>
        <span className="rail-text">Kênh nhóm &amp; Trợ lý AI</span>
        <span className="rail-badge">1</span>
        <span aria-hidden="true">◀</span>
      </button>
    </>
  );
}

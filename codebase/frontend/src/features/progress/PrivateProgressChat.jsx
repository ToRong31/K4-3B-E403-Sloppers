import { useEffect, useId, useRef, useState } from 'react';

import { createProgressChatDemoReply } from './progressChatDemo';

const quickQuestions = [
  'Tôi cần làm gì?',
  'Task này cần làm như thế nào?',
  'Nhóm còn bao nhiêu việc?',
];

function initialAssistantMessage(isMock) {
  return {
    id: 'welcome',
    role: 'assistant',
    answer: 'Mình có thể giải thích task của bạn hoặc tóm tắt tiến độ nhóm. Mình không tự đổi owner hay trạng thái task.',
    reference_ids: [],
    isMock,
  };
}

function SourceReferences({ references }) {
  if (!references?.length) return null;
  return (
    <div className="progress-chat-references" aria-label="Nguồn bài Lab">
      {references.map((reference) => <span key={reference}>⌁ {reference}</span>)}
    </div>
  );
}

export function PrivateProgressChat({ snapshot, user, isMock }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [messages, setMessages] = useState(() => [initialAssistantMessage(isMock)]);
  const [isResponding, setIsResponding] = useState(false);
  const inputRef = useRef(null);
  const panelTitleId = useId();
  const ownTasks = snapshot.tasks.filter((task) => task.owner === user.shortName);

  useEffect(() => {
    if (open) window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!selectedTaskId && ownTasks[0]) setSelectedTaskId(ownTasks[0].id);
  }, [ownTasks, selectedTaskId]);

  const sendQuestion = (rawQuestion) => {
    const submittedQuestion = rawQuestion.trim();
    if (!submittedQuestion || isResponding) return;

    setMessages((current) => [...current, {
      id: `user-${Date.now()}`,
      role: 'user',
      answer: submittedQuestion,
    }]);
    setQuestion('');
    setIsResponding(true);

    window.setTimeout(() => {
      const reply = isMock
        ? createProgressChatDemoReply({
          question: submittedQuestion,
          taskId: selectedTaskId,
          tasks: snapshot.tasks,
          user,
        })
        : {
          status: 'clarify',
          answer: 'Progress Chat API chưa được kết nối. Không có câu trả lời AI để hiển thị.',
          task_ids: [],
          reference_ids: [],
          suggested_next_action: 'Hãy thử lại sau khi backend Progress Chat được bật.',
        };
      setMessages((current) => [...current, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        ...reply,
        isMock,
      }]);
      setIsResponding(false);
    }, isMock ? 260 : 0);
  };

  const resetConversation = () => {
    setMessages([initialAssistantMessage(isMock)]);
    setQuestion('');
  };

  return (
    <>
      <button
        className="secondary-button progress-chat-launcher"
        type="button"
        aria-expanded={open}
        aria-controls="private-progress-chat"
        onClick={() => setOpen(true)}
      >
        🤖 Trợ lý Lab AI
      </button>

      {open && <button className="progress-chat-scrim" type="button" aria-label="Đóng Trợ lý Lab AI" onClick={() => setOpen(false)} />}
      <aside
        className={`private-progress-chat ${open ? 'open' : ''}`}
        id="private-progress-chat"
        aria-labelledby={panelTitleId}
        aria-hidden={!open}
      >
        <header className="progress-chat-header">
          <div>
            <span>LABSPACE · CHAT RIÊNG</span>
            <h2 id={panelTitleId}>Trợ lý Lab AI <i>1:1</i></h2>
          </div>
          <button type="button" aria-label="Đóng Trợ lý Lab AI" onClick={() => setOpen(false)}>×</button>
        </header>

        <div className="progress-chat-context">
          <div className="progress-chat-bot-avatar" aria-hidden="true">✦</div>
          <div><b>Giải thích task & tiến độ</b><small>Chỉ đọc task thuộc nhóm hiện tại</small></div>
          <button type="button" onClick={resetConversation}>↻ Mới</button>
        </div>

        {isMock && <p className="progress-chat-demo-note">Dữ liệu demo · chưa đồng bộ Progress Chat backend</p>}

        <div className="progress-chat-quick-prompts" aria-label="Câu hỏi gợi ý">
          {quickQuestions.map((quickQuestion) => (
            <button key={quickQuestion} type="button" onClick={() => sendQuestion(quickQuestion)}>
              {quickQuestion}
            </button>
          ))}
        </div>

        <label className="progress-chat-task-context">
          <span>Ngữ cảnh task</span>
          <select value={selectedTaskId} onChange={(event) => setSelectedTaskId(event.target.value)} disabled={!ownTasks.length}>
            {!ownTasks.length && <option>Chưa có task được giao</option>}
            {ownTasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
          </select>
        </label>

        <div className="progress-chat-messages" aria-live="polite">
          {messages.map((message) => (
            <article className={`progress-chat-message ${message.role}`} key={message.id}>
              <small>{message.role === 'user' ? 'Bạn' : 'Trợ lý Lab AI'}{message.status === 'clarify' ? ' · Cần làm rõ' : ''}</small>
              <p>{message.answer}</p>
              <SourceReferences references={message.reference_ids} />
              {message.suggested_next_action && <em>→ {message.suggested_next_action}</em>}
            </article>
          ))}
          {isResponding && <div className="progress-chat-typing" aria-label="Trợ lý đang trả lời"><i /><i /><i /></div>}
        </div>

        <form className="progress-chat-form" onSubmit={(event) => { event.preventDefault(); sendQuestion(question); }}>
          <label className="sr-only" htmlFor="private-progress-question">Hỏi Trợ lý Lab AI</label>
          <input
            ref={inputRef}
            id="private-progress-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Hỏi về task hoặc tiến độ nhóm..."
            autoComplete="off"
          />
          <button className="primary-button" type="submit" disabled={!question.trim() || isResponding} aria-label="Gửi câu hỏi">→</button>
        </form>
      </aside>
    </>
  );
}

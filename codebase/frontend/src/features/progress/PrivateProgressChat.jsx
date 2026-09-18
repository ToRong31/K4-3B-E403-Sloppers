import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { apiClient } from '../../api/createApiClient';
import { useRealtime } from '../../realtime/useRealtime';
import { ChatMessageContent } from './ChatMessageContent';
import { buildPrivateChatRequest } from './privateChatRequest';
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

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function PrivateProgressChat({ snapshot, user, isMock, labId }) {
  const { client: realtimeClient, status: realtimeStatus } = useRealtime();
  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('group');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState(() => [initialAssistantMessage(isMock)]);
  const [isResponding, setIsResponding] = useState(false);
  const [groupInput, setGroupInput] = useState('');
  const [groupChatMessages, setGroupChatMessages] = useState(() =>
    isMock ? createGroupChatDemoMessages({ members: snapshot.members, tasks: snapshot.tasks, user }) : [],
  );

  // Attachments state
  const [groupAttachment, setGroupAttachment] = useState(null);
  const [aiAttachment, setAiAttachment] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const inputRef = useRef(null);
  const groupInputRef = useRef(null);
  const groupFileInputRef = useRef(null);
  const groupImageInputRef = useRef(null);
  const aiFileInputRef = useRef(null);
  const aiImageInputRef = useRef(null);

  const panelLabelId = useId();
  const ownTasks = useMemo(
    () => snapshot.tasks.filter((task) => task.owner === user.shortName),
    [snapshot.tasks, user.shortName],
  );
  const selectedTaskId = ownTasks[0]?.id ?? '';

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && previewImage) {
        setPreviewImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImage]);

  // Load chat history from backend on mount and whenever active group or user changes
  useEffect(() => {
    let ignore = false;
    async function loadHistory() {
      try {
        if (apiClient.getGroupChatMessages) {
          const gid = snapshot?.group?.id;
          const history = await apiClient.getGroupChatMessages(gid);
          if (!ignore && history && Array.isArray(history)) {
            setGroupChatMessages(history);
          }
        }
      } catch (err) {
        console.warn('Could not load group chat from backend:', err);
      }
    }
    loadHistory();
    return () => {
      ignore = true;
    };
  }, [snapshot?.group?.id, user?.accountId, user?.id]);

  // Listen to realtime websocket broadcasts
  useEffect(() => {
    if (!realtimeClient?.subscribe) return;
    const unsubscribe = realtimeClient.subscribe((event) => {
      if (event.type === 'chat.message_sent' && event.payload) {
        const incoming = event.payload;
        setGroupChatMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev;
          const isDuplicate = prev.some(
            (m) =>
              (m.author === incoming.author || m.shortName === incoming.shortName) &&
              m.text === incoming.text &&
              m.time === incoming.time,
          );
          if (isDuplicate) return prev;
          return [...prev, incoming];
        });
      }
    });
    return () => unsubscribe();
  }, [realtimeClient]);

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

  const handleFileChosen = (file, channel) => {
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const attachment = {
        name: file.name,
        size: file.size,
        formattedSize: formatBytes(file.size),
        type: file.type || (isImage ? 'image/jpeg' : 'application/octet-stream'),
        dataUrl,
        isImage,
      };
      if (channel === 'group') {
        setGroupAttachment(attachment);
      } else {
        setAiAttachment(attachment);
      }
    };
    reader.readAsDataURL(file);
  };

  const sendQuestion = async (rawQuestion, overrideAttachment = undefined) => {
    const activeAttachment = overrideAttachment !== undefined ? overrideAttachment : aiAttachment;
    const submittedQuestion = (rawQuestion || '').trim();
    if ((!submittedQuestion && !activeAttachment) || isResponding) return;

    setQuestion('');
    setAiAttachment(null);
    if (aiFileInputRef.current) aiFileInputRef.current.value = '';
    if (aiImageInputRef.current) aiImageInputRef.current.value = '';

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      answer: submittedQuestion || (activeAttachment ? `[Đã gửi đính kèm: ${activeAttachment.name}]` : ''),
      ...(activeAttachment?.isImage ? { image: activeAttachment.dataUrl } : {}),
      ...(!activeAttachment?.isImage && activeAttachment ? {
        file: {
          name: activeAttachment.name,
          size: activeAttachment.formattedSize,
          type: activeAttachment.type,
          dataUrl: activeAttachment.dataUrl,
        },
      } : {}),
    };

    setMessages((current) => [...current, userMessage]);
    setIsResponding(true);

    try {
      let reply = null;
      if (apiClient.sendChatMessage) {
        reply = await apiClient.sendChatMessage(buildPrivateChatRequest({
          question: submittedQuestion,
          user,
          snapshot,
          taskId: selectedTaskId,
          labId,
          attachment: activeAttachment,
        }));
      }
      if (!reply) {
        if (!isMock) throw new Error('Chat API không trả về phản hồi.');
        reply = createProgressChatDemoReply({
          question: submittedQuestion || activeAttachment?.name || 'Tài liệu',
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
      setMessages((current) => [...current, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        status: 'error',
        answer: err instanceof Error
          ? err.message
          : 'Không thể kết nối Trợ lý AI. Vui lòng thử lại.',
        reference_ids: [],
        isMock: false,
      }]);
    } finally {
      setIsResponding(false);
    }
  };

  const resetConversation = () => {
    setMessages([initialAssistantMessage(isMock)]);
    setQuestion('');
    setAiAttachment(null);
    if (aiFileInputRef.current) aiFileInputRef.current.value = '';
    if (aiImageInputRef.current) aiImageInputRef.current.value = '';
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleSendGroupMessage = async (e) => {
    e?.preventDefault();
    const text = groupInput.trim();
    if (!text && !groupAttachment) return;

    const currentAttachment = groupAttachment;
    setGroupInput('');
    setGroupAttachment(null);
    if (groupFileInputRef.current) groupFileInputRef.current.value = '';
    if (groupImageInputRef.current) groupImageInputRef.current.value = '';

    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      groupId: snapshot.group?.id || 'group-sloppers',
      senderId: user.id,
      senderCode: user.accountId,
      author: user.displayName || user.name || user.shortName,
      shortName: user.shortName,
      initial: (user.shortName || user.displayName || user.name)?.[0]?.toUpperCase() || 'T',
      role: user.roleLabel || 'Thành viên',
      isLeader: user.role === 'leader',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      text,
      ...(currentAttachment?.isImage ? { image: currentAttachment.dataUrl } : {}),
      ...(!currentAttachment?.isImage && currentAttachment ? {
        file: {
          name: currentAttachment.name,
          size: currentAttachment.formattedSize,
          type: currentAttachment.type,
          dataUrl: currentAttachment.dataUrl,
        },
      } : {}),
    };

    // Optimistically update local message list
    setGroupChatMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });

    try {
      if (apiClient.sendGroupChatMessage) {
        await apiClient.sendGroupChatMessage(newMsg);
      }
      if (realtimeStatus === 'connected' && realtimeClient?.publish) {
        realtimeClient.publish({
          type: 'chat.message_sent',
          scope_id: snapshot.group?.id || 'group-sloppers',
          payload: newMsg,
        });
      }
    } catch (err) {
      console.warn('Error sending group message:', err);
    }
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

        {/* TAB 1: KÊNH NHÓM */}
        <section className={`chat-tab-content ${activeTab === 'group' ? 'active' : ''}`} role="tabpanel">
          <div className="group-channel-bar">
            <div className="group-channel-meta">
              <span className="online-pill">● {snapshot.members.length} thành viên</span>
              <span className="bot-present-pill">🤖 AI trong nhóm</span>
            </div>
            <button className="group-ai-summary-btn" type="button" disabled title="Sẽ nối backend ở task chat nhóm">✨ AI tóm tắt</button>
          </div>
          <div className="chat-messages" aria-live="polite">
            {groupChatMessages.map((message) => {
              const isMine = Boolean(
                (message.senderCode && message.senderCode === user.accountId) ||
                (message.senderId && message.senderId === user.id) ||
                (message.shortName && message.shortName === user.shortName) ||
                (message.author && (message.author === user.displayName || message.author === user.name || message.author === user.shortName))
              );
              return (
                <article className={`chat-msg-row ${isMine ? 'mine' : 'peer'}`} key={message.id}>
                  <span className={`chat-msg-avatar ${message.isLeader ? 'leader' : 'member'}`} aria-hidden="true">
                    {message.initial}
                  </span>
                  <div className="chat-msg-content">
                    <div className="chat-msg-meta">
                      <span className="author-name">{isMine ? 'Bạn' : message.author}</span>
                      <span className="author-role-tag">{message.role}</span>
                      <span>{message.time}</span>
                    </div>
                    <div className="chat-msg-bubble">
                      {message.text && <div>{message.text}</div>}
                      {message.image && (
                        <div className="chat-bubble-image-wrap">
                          <img
                            src={message.image}
                            alt="Ảnh đính kèm"
                            className="chat-bubble-image"
                            onClick={() => setPreviewImage(message.image)}
                          />
                        </div>
                      )}
                      {message.file && (
                        <div className="chat-doc-card">
                          <span className="doc-icon-badge" aria-hidden="true">📄</span>
                          <div className="doc-text-meta">
                            <span className="doc-title" title={message.file.name}>{message.file.name}</span>
                            <span className="doc-sub">{message.file.size}</span>
                          </div>
                          <a
                            className="doc-action-btn"
                            href={message.file.dataUrl}
                            download={message.file.name}
                            title="Tải tệp xuống"
                          >
                            Tải về
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="chat-footer">
            {groupAttachment && (
              <div className="chat-attach-staging">
                <div className="attach-staging-preview">
                  {groupAttachment.isImage ? (
                    <img src={groupAttachment.dataUrl} alt="Preview" className="attach-staging-thumb" />
                  ) : (
                    <span className="attach-staging-icon">📄</span>
                  )}
                  <div className="attach-staging-info">
                    <span className="attach-staging-name" title={groupAttachment.name}>{groupAttachment.name}</span>
                    <span className="attach-staging-size">{groupAttachment.formattedSize}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="attach-staging-remove"
                  title="Hủy đính kèm"
                  onClick={() => {
                    setGroupAttachment(null);
                    if (groupFileInputRef.current) groupFileInputRef.current.value = '';
                    if (groupImageInputRef.current) groupImageInputRef.current.value = '';
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            <div className="chat-input-toolbar">
              <span className={`chat-connection-indicator ${realtimeStatus}`}>
                ● {realtimeStatus === 'connected' ? 'Real-time WebSocket' : 'Đang đồng bộ'}
              </span>
              <div className="chat-toolbar-actions">
                <button
                  type="button"
                  className="chat-tool-btn"
                  title="Gửi hình ảnh"
                  onClick={() => groupImageInputRef.current?.click()}
                >
                  🖼️ Ảnh
                </button>
                <button
                  type="button"
                  className="chat-tool-btn"
                  title="Gửi tệp đính kèm"
                  onClick={() => groupFileInputRef.current?.click()}
                >
                  📎 Tệp
                </button>
              </div>
            </div>

            <input
              ref={groupImageInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                handleFileChosen(e.target.files?.[0], 'group');
                e.target.value = '';
              }}
            />
            <input
              ref={groupFileInputRef}
              type="file"
              accept="*/*"
              className="sr-only"
              onChange={(e) => {
                handleFileChosen(e.target.files?.[0], 'group');
                e.target.value = '';
              }}
            />

            <form className="chat-input-form" onSubmit={handleSendGroupMessage}>
              <input
                ref={groupInputRef}
                className="chat-input"
                value={groupInput}
                onChange={(e) => setGroupInput(e.target.value)}
                placeholder={groupAttachment ? 'Thêm ghi chú cho tệp/ảnh...' : 'Nhập tin nhắn cho cả nhóm...'}
              />
              <button
                className="chat-send-btn"
                type="submit"
                disabled={!groupInput.trim() && !groupAttachment}
                aria-label="Gửi tin nhắn nhóm"
              >
                <SendIcon />
              </button>
            </form>
          </div>
        </section>

        {/* TAB 2: TRỢ LÝ LAB AI */}
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

          {isMock && <div className="chat-identity-banner"><strong>Ngữ cảnh trực tiếp</strong> · Đọc task hiện tại từ LabSpace</div>}

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
                  {message.role === 'user' ? (
                    <>
                      {message.answer && <p>{message.answer}</p>}
                      {message.image && (
                        <div className="chat-bubble-image-wrap">
                          <img
                            src={message.image}
                            alt="Ảnh đính kèm"
                            className="chat-bubble-image"
                            onClick={() => setPreviewImage(message.image)}
                          />
                        </div>
                      )}
                      {message.file && (
                        <div className="chat-doc-card">
                          <span className="doc-icon-badge" aria-hidden="true">📄</span>
                          <div className="doc-text-meta">
                            <span className="doc-title" title={message.file.name}>{message.file.name}</span>
                            <span className="doc-sub">{message.file.size}</span>
                          </div>
                          <a
                            className="doc-action-btn"
                            href={message.file.dataUrl}
                            download={message.file.name}
                            title="Tải tệp xuống"
                          >
                            Tải về
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <ChatMessageContent content={message.answer} />
                  )}
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
            {aiAttachment && (
              <div className="chat-attach-staging">
                <div className="attach-staging-preview">
                  {aiAttachment.isImage ? (
                    <img src={aiAttachment.dataUrl} alt="Preview" className="attach-staging-thumb" />
                  ) : (
                    <span className="attach-staging-icon">📄</span>
                  )}
                  <div className="attach-staging-info">
                    <span className="attach-staging-name" title={aiAttachment.name}>{aiAttachment.name}</span>
                    <span className="attach-staging-size">{aiAttachment.formattedSize}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="attach-staging-remove"
                  title="Hủy đính kèm"
                  onClick={() => {
                    setAiAttachment(null);
                    if (aiFileInputRef.current) aiFileInputRef.current.value = '';
                    if (aiImageInputRef.current) aiImageInputRef.current.value = '';
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            <div className="chat-input-toolbar">
              <span className="chat-connection-indicator connected">● Trợ lý AI sẵn sàng</span>
              <div className="chat-toolbar-actions">
                <button
                  type="button"
                  className="chat-tool-btn"
                  title="Gửi hình ảnh để AI xem"
                  onClick={() => aiImageInputRef.current?.click()}
                >
                  🖼️ Ảnh
                </button>
                <button
                  type="button"
                  className="chat-tool-btn"
                  title="Gửi tài liệu để AI phân tích"
                  onClick={() => aiFileInputRef.current?.click()}
                >
                  📎 Tệp
                </button>
              </div>
            </div>

            <input
              ref={aiImageInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                handleFileChosen(e.target.files?.[0], 'ai');
                e.target.value = '';
              }}
            />
            <input
              ref={aiFileInputRef}
              type="file"
              accept="*/*"
              className="sr-only"
              onChange={(e) => {
                handleFileChosen(e.target.files?.[0], 'ai');
                e.target.value = '';
              }}
            />

            <form className="chat-input-form" onSubmit={(event) => { event.preventDefault(); sendQuestion(question); }}>
              <label className="sr-only" htmlFor="private-progress-question">Hỏi Trợ lý Lab AI</label>
              <input
                ref={inputRef}
                id="private-progress-question"
                className="chat-input"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={aiAttachment ? 'Hỏi AI về tệp/ảnh này...' : 'Hỏi Trợ lý AI về task, checklist, tiến độ...'}
                autoComplete="off"
              />
              <button
                className="ai-send-btn"
                type="submit"
                disabled={(!question.trim() && !aiAttachment) || isResponding}
                aria-label="Hỏi Trợ lý Lab AI"
              >
                <SendIcon />
              </button>
            </form>
          </div>
        </section>
      </aside>

      {/* Lightbox xem ảnh kích thước lớn */}
      {previewImage && (
        <div className="chat-image-lightbox" onClick={() => setPreviewImage(null)} role="dialog" aria-label="Xem ảnh phóng to">
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lightbox-close-btn"
              onClick={() => setPreviewImage(null)}
              title="Đóng (ESC)"
              aria-label="Đóng ảnh phóng to"
            >
              ✕
            </button>
            <img src={previewImage} alt="Ảnh phóng to" className="lightbox-image" />
          </div>
        </div>
      )}

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

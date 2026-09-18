import { useState } from 'react';

const quickSuggestions = [
  {
    label: '🎯 Vướng Golden Set CP3',
    text: 'Nhóm em đang bị vướng tiêu chí đánh giá độ chính xác của Golden Set CP3, mong Coach xem giúp bộ test 20 prompt ạ!',
  },
  {
    label: '⚠️ Task CP2 bị Blocked',
    text: 'Task dựng Flow CP2 của nhóm đang bị blocked do chưa thống nhất luồng Canvas, Coach cho nhóm xin ý kiến với ạ.',
  },
  {
    label: '📋 Review phân công task',
    text: 'Nhóm em cần Coach review trước bản nháp phân công công việc AI xem đã cân bằng khối lượng chưa ạ.',
  },
];

const topicOptions = [
  'Checkpoint 3: Golden Set Benchmark & Prompt (CP3)',
  'Checkpoint 2: Flow tương tác & Wireframe (CP2)',
  'Checkpoint 1: Phỏng vấn & Canvas 7 dòng',
  'Kỹ thuật: Kết nối API & Cấu trúc mã nguồn',
  'Khác: Phân bổ công việc & Thắc mắc tiêu chí',
];

export function CoachHelpDialog({
  open,
  onClose,
  group,
  user,
  supportRequests = [],
  onCreated,
  apiClient,
}) {
  const [topic, setTopic] = useState(topicOptions[0]);
  const [question, setQuestion] = useState('');
  const [urgent, setUrgent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!open) return null;

  const latestRequest = supportRequests && supportRequests.length > 0
    ? supportRequests[supportRequests.length - 1]
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) {
      setErrorMessage('Vui lòng nhập nội dung câu hỏi hoặc vấn đề nhóm đang gặp phải.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (apiClient?.createSupportRequest) {
        const payload = {
          topic,
          question: trimmed,
          urgent,
          groupId: group?.id,
        };
        const res = await apiClient.createSupportRequest(payload);
        if (onCreated) {
          onCreated(res);
        }
      }
      setQuestion('');
      onClose();
    } catch (err) {
      console.error('Error creating support request:', err);
      setErrorMessage(err.message || 'Không thể gửi yêu cầu hỗ trợ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const senderRoleLabel = user?.role === 'leader' ? 'Nhóm trưởng' : 'Thành viên';
  const senderName = user?.displayName || user?.name || user?.shortName || 'Thành viên';

  return (
    <dialog
      className="setup-dialog help-dialog"
      open
      aria-labelledby="coachHelpTitle"
      style={{ display: 'block', margin: 'auto' }}
    >
      <div className="dialog-top">
        <div>
          <span>LABSPACE · PHIÊN HỖ TRỢ TRỰC TUYẾN</span>
          <h2 id="coachHelpTitle">Gửi yêu cầu hỗ trợ tới Lab Coach</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}
        >
          ×
        </button>
      </div>

      <div className="dialog-step active">
        {/* Team & Sender info */}
        <div className="help-team-info-banner">
          <div className="team-avatar-badge" aria-hidden="true">👥</div>
          <div>
            <strong>Nhóm {group?.name || 'Sloppers'} (Mã nhóm: {group?.code || 'SLOP-3B'})</strong>
            <small>Người gửi: {senderName} ({senderRoleLabel}) · Mini Hackathon AI</small>
          </div>
        </div>

        {/* Existing Active/Resolved Request Status Card */}
        {latestRequest && (
          <div className="coach-request-card">
            <div className="request-card-header">
              <div className="request-sender-info">
                <span className="request-role-avatar" aria-hidden="true">
                  {latestRequest.status === 'pending' ? '⏳' : '✓'}
                </span>
                <div>
                  <strong>Yêu cầu gần nhất: {latestRequest.topic}</strong>
                  <small>
                    {latestRequest.createdAt
                      ? `Gửi lúc ${new Date(latestRequest.createdAt).toLocaleTimeString('vi-VN')}`
                      : 'Đã gửi'}
                  </small>
                </div>
              </div>
              <span
                className={`request-status-badge ${
                  latestRequest.status === 'pending' ? 'pending' : 'resolved'
                }`}
              >
                {latestRequest.status === 'pending' ? '⏳ Chờ Coach giải đáp' : '✓ Coach đã giải đáp'}
              </span>
            </div>

            <div className="request-question-content">
              <div className="question-label">Nội dung câu hỏi đã gửi:</div>
              <blockquote>{latestRequest.question}</blockquote>
            </div>

            {latestRequest.replies && latestRequest.replies.length > 0 && (
              <div className="coach-history-section" style={{ marginTop: '12px' }}>
                <strong style={{ fontSize: '12px', color: '#166534' }}>Phản hồi từ Lab Coach:</strong>
                {latestRequest.replies.map((reply) => (
                  <div className="coach-history-item" key={reply.id}>
                    <p style={{ margin: 0 }}>{reply.message}</p>
                    <small>
                      {reply.createdAt
                        ? new Date(reply.createdAt).toLocaleTimeString('vi-VN')
                        : ''}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Form to submit new request */}
        <form onSubmit={handleSubmit}>
          <p className="step-intro" style={{ margin: '8px 0 12px', fontSize: '13px', color: '#64748b' }}>
            Coach sẽ nhận được thông báo về tình trạng nhóm kèm câu hỏi để hỗ trợ trực tiếp hoặc gửi giải đáp qua kênh LabSpace.
          </p>

          {errorMessage && (
            <div
              style={{
                color: '#dc2626',
                background: '#fef2f2',
                padding: '8px 12px',
                borderRadius: '6px',
                marginBottom: '12px',
                fontSize: '13px',
              }}
            >
              {errorMessage}
            </div>
          )}

          <div className="form-field" style={{ marginBottom: '14px' }}>
            <label htmlFor="helpTopicSelect" style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '13px' }}>
              Chủ đề cần Coach hướng dẫn / giải đáp:
            </label>
            <select
              id="helpTopicSelect"
              className="help-select"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              {topicOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field" style={{ marginBottom: '10px' }}>
            <label htmlFor="helpQuestionText" style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '13px' }}>
              Nội dung câu hỏi hoặc vấn đề nhóm đang gặp phải: <b style={{ color: 'var(--red, #ef4444)' }}>*</b>
            </label>
            <textarea
              id="helpQuestionText"
              className="help-textarea"
              rows={4}
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Mô tả cụ thể khó khăn nhóm đang gặp phải, câu hỏi cần Coach hướng dẫn, đoạn lỗi code hoặc thắc mắc về tiêu chí đánh giá..."
            />
          </div>

          <div className="quick-question-suggestions">
            <span className="quick-suggest-label">Gợi ý mẫu câu hỏi nhanh:</span>
            <div className="quick-suggest-chips">
              {quickSuggestions.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="quick-chip-btn"
                  onClick={() => setQuestion(item.text)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <label className="help-urgent-checkbox">
            <input
              type="checkbox"
              id="helpUrgentCheck"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
            />
            <span>⚠️ Đánh dấu <b>Khẩn cấp</b> (Nhóm đang bị tắc nghẽn hoàn toàn - Blocked)</span>
          </label>

          <div className="dialog-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              className="secondary-button"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Đóng
            </button>
            <button
              className="primary-button"
              type="submit"
              disabled={isSubmitting || !question.trim()}
            >
              {isSubmitting ? 'Đang gửi...' : '🚀 Gửi yêu cầu tới Coach'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

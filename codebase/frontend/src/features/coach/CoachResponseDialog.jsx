import { useState } from 'react';

export function CoachResponseDialog({
  open,
  onClose,
  group,
  request,
  onResolved,
  apiClient,
}) {
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!open || !request) return null;

  const handleResolve = async (e) => {
    e?.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (apiClient?.resolveSupportRequest) {
        await apiClient.resolveSupportRequest(request.id, responseMessage.trim());
        if (onResolved) {
          onResolved(request.id);
        }
      }
      onClose();
    } catch (err) {
      console.error('Error resolving support request:', err);
      setErrorMessage(err.message || 'Không thể gửi giải đáp. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      className="setup-dialog coach-response-dialog"
      open
      aria-labelledby="coachResponseTitle"
      style={{ display: 'block', margin: 'auto' }}
    >
      <div className="dialog-top">
        <div>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
            LAB COACH · PHIÊN HỖ TRỢ NHÓM LAB
          </span>
          <h2 id="coachResponseTitle">
            Yêu cầu hỗ trợ — {group?.name || 'Nhóm'} ({group?.code || 'LAB'})
          </h2>
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

        <div className="coach-request-card">
          <div className="request-card-header">
            <div className="request-sender-info">
              <span className="request-role-avatar" aria-hidden="true">
                {request.urgent ? '⚠️' : '👤'}
              </span>
              <div>
                <strong>
                  {request.sender?.name || 'Thành viên'} · Nhóm {group?.name || 'Sloppers'}
                </strong>
                <small>
                  {request.createdAt
                    ? `Gửi lúc ${new Date(request.createdAt).toLocaleTimeString('vi-VN')}`
                    : 'Mới gửi'}
                  {request.urgent && ' · [Khẩn cấp: Blocked]'}
                </small>
              </div>
            </div>
            <span
              className={`request-status-badge ${
                request.status === 'pending' ? 'pending' : 'resolved'
              }`}
            >
              {request.status === 'pending' ? '⏳ Chờ giải đáp' : '✓ Đã giải đáp'}
            </span>
          </div>

          <div className="request-topic-row">
            Chủ đề: <strong>{request.topic}</strong>
          </div>

          <div className="request-question-content">
            <div className="question-label">Nội dung câu hỏi:</div>
            <blockquote>{request.question}</blockquote>
          </div>
        </div>

        {request.status !== 'resolved' ? (
          <form onSubmit={handleResolve}>
            <div className="coach-reply-box">
              <div className="form-field-label">
                <strong>Nội dung hướng dẫn / giải đáp từ Lab Coach:</strong>
                <small>
                  Phản hồi này sẽ được lưu vào lịch sử hỗ trợ và gửi trực tiếp tới các thành viên nhóm.
                </small>
              </div>
              <textarea
                className="coach-textarea"
                rows={4}
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Nhập nội dung hướng dẫn giải quyết vấn đề, gợi ý checkpoint hoặc gỡ block cho nhóm..."
              />
            </div>

            <div className="coach-modal-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Đóng
              </button>
              <div className="coach-right-btns">
                <button
                  className="primary-button success-btn"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang gửi...' : '✓ Giải đáp & Hoàn thành'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="dialog-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="secondary-button" type="button" onClick={onClose}>
              Đóng
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}

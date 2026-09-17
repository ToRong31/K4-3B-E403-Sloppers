export function LoadingState({ label = 'Đang tải dữ liệu…' }) {
  return (
    <div className="panel-state" aria-live="polite">
      <div className="loader" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="panel-state error-state" role="alert">
      <b>Không thể tải dữ liệu</b>
      <p>{message}</p>
      {onRetry && <button className="primary-button" onClick={onRetry}>Thử lại</button>}
    </div>
  );
}


import { useCallback } from 'react';

import { apiClient } from '../../api/createApiClient';
import { useAuth } from '../../auth/useAuth';
import { ErrorState, LoadingState } from '../../components/PageState';
import { useAsyncResource } from '../../hooks/useAsyncResource';

const statusLabel = {
  accepted: 'Đã vào',
  pending: 'Chờ',
  declined: 'Từ chối',
};

export function WorkspacePage() {
  const { user } = useAuth();
  const loader = useCallback(() => apiClient.getWorkspaceSnapshot(), []);
  const { status, data, error, reload } = useAsyncResource(loader);

  if (status === 'loading') return <main className="page-shell"><LoadingState label="Đang tải LabSpace…" /></main>;
  if (status === 'error') return <main className="page-shell"><ErrorState message={error.message} onRetry={reload} /></main>;

  const completed = data.tasks.filter((task) => task.status === 'done').length;
  const progress = Math.round((completed / data.tasks.length) * 100);
  const isLeader = user.role === 'leader';

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div>
          <p className="breadcrumbs">Lab › K4–L3B–DAY05–06 › Nhóm {data.group.name}</p>
          <h1>LABSPACE · {data.group.name.toUpperCase()}</h1>
          <p><span className="role-tag">VIEW {user.roleLabel.toUpperCase()}</span> Mini Hackathon AI</p>
        </div>
        <button className="secondary-button" type="button">Mã nhóm: <b>{data.group.code}</b> ⧉</button>
      </header>

      <div className="workspace-grid">
        <aside className="card team-panel">
          <div className="card-heading"><h2>Thành viên</h2><span>{data.members.filter((m) => m.status === 'accepted').length}/{data.members.length} xác nhận</span></div>
          <ul className="member-list">
            {data.members.map((member) => (
              <li key={member.id}>
                <span className="member-avatar">{member.name[0]}</span>
                <div><b>{member.name}</b><small>{member.role}</small></div>
                <em className={member.status}>{statusLabel[member.status]}</em>
              </li>
            ))}
          </ul>
          <button className="primary-button full" type="button" disabled={!isLeader}>
            ✦ {isLeader ? 'Tạo bản nháp phân công AI' : 'Chờ nhóm trưởng phân công'}
          </button>
          {!isLeader && <p className="permission-note">🔒 Chỉ nhóm trưởng có quyền tạo và phê duyệt kế hoạch.</p>}
          <div className="source-note"><b>Nguồn checklist</b><p>{data.checklistSource}</p></div>
        </aside>

        <section className="card board-panel">
          <div className="card-heading">
            <div><h2>Kế hoạch của nhóm</h2><p>Shell UI đang đọc qua API adapter; mutation sẽ được nối ở bước tiếp theo.</p></div>
            <span className="status-chip">{data.planStatus === 'draft' ? 'Bản nháp' : data.planStatus}</span>
          </div>
          <div className="overall-progress"><i style={{ width: `${progress}%` }} /></div>
          <div className="task-list">
            {data.tasks.map((task) => (
              <article className={`task ${task.status}`} key={task.id}>
                <span className={`task-check ${task.status === 'done' ? 'checked' : ''}`}>{task.status === 'done' ? '✓' : ''}</span>
                <div className="task-main"><span className="task-tag">{task.category}</span><h3>{task.title}</h3><p>Deliverable: {task.deliverable}</p></div>
                <div className="task-owner"><span className="member-avatar">{task.owner[0]}</span><div><b>{task.owner}</b><small>{task.status}</small></div></div>
              </article>
            ))}
          </div>
        </section>

        <aside className="card submit-panel">
          <div className="ready-score"><div className="progress-ring">{progress}%</div><h2>Tiến độ nhóm</h2><p>{completed}/{data.tasks.length} task hoàn thành</p></div>
          <div className="deliverable-list">
            <h3>Deliverable trong fixture</h3>
            {data.tasks.map((task) => <label key={task.id}><input type="checkbox" checked={task.status === 'done'} readOnly /> {task.deliverable}</label>)}
          </div>
          <button className="danger-outline full" type="button">☝ Yêu cầu Coach hỗ trợ</button>
          <p className="privacy-note">Coach chỉ thấy tiến độ nhóm và yêu cầu hỗ trợ được gửi.</p>
        </aside>
      </div>
    </main>
  );
}


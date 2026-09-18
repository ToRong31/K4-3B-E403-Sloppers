import { useCallback } from 'react';

import { apiClient } from '../../api/createApiClient';
import { ErrorState, LoadingState } from '../../components/PageState';
import { useAsyncResource } from '../../hooks/useAsyncResource';

export function CoachDashboardPage() {
  const loader = useCallback(() => apiClient.getCoachSnapshot(), []);
  const { status, data, error, reload } = useAsyncResource(loader);

  return (
    <main className="page-shell coach-shell">
      <header className="page-heading"><div><p className="eyebrow">LAB COACH · E403</p><h1>TIẾN ĐỘ <span>NHÓM LAB</span></h1><p>Chỉ hiển thị trạng thái cấp nhóm và yêu cầu hỗ trợ.</p></div></header>
      {status === 'loading' && <LoadingState />}
      {status === 'error' && <ErrorState message={error.message} onRetry={reload} />}
      {status === 'ready' && (
        <>
          <section className="coach-summary">
            <article><strong>{data.summary.activeGroups}</strong><span>Nhóm đang làm</span></article>
            <article><strong>{data.summary.aboveEighty}</strong><span>Đã hoàn thành ≥80%</span></article>
            <article><strong>{data.summary.blocked}</strong><span>Có task blocked</span></article>
            <article className="alert"><strong>{data.summary.helpNeeded}</strong><span>Đang yêu cầu hỗ trợ</span></article>
          </section>
          <section className="card coach-table" aria-label="Tiến độ các nhóm">
            <div className="coach-row header"><span>Nhóm</span><span>Checklist</span><span>Blocked</span><span>Check-in gần nhất</span><span>Hỗ trợ</span></div>
            {data.groups.map((group) => (
              <div className={`coach-row ${group.name === 'Sloppers' ? 'highlighted' : ''}`} key={group.id}>
                <span><b>{group.name}</b><small>{group.code}</small></span>
                <span><i className="mini-progress"><em style={{ width: `${group.progress}%` }} /></i><b>{group.progress}%</b></span>
                <span className={group.blocked ? 'warning' : ''}>{group.blocked} task</span>
                <span>{group.lastCheckIn}</span>
                <span>{group.help === 'pending' ? <button className="danger-outline">⚠ Xem yêu cầu</button> : '—'}</span>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}


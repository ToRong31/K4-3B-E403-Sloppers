import { useCallback, useEffect, useState } from 'react';

import { apiClient } from '../../api/createApiClient';
import { ErrorState, LoadingState } from '../../components/PageState';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { CoachResponseDialog } from './CoachResponseDialog';

export function CoachDashboardPage() {
  const loader = useCallback(() => apiClient.getCoachSnapshot(), []);
  const { status, data, error, reload } = useAsyncResource(loader);
  const [supportRequests, setSupportRequests] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      if (apiClient.getSupportRequests) {
        const reqs = await apiClient.getSupportRequests();
        if (reqs && Array.isArray(reqs)) {
          setSupportRequests(reqs);
        }
      }
    } catch (err) {
      console.warn('Could not load coach support requests:', err);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleOpenRequest = (group) => {
    setSelectedGroup(group);
    // Find matching request for group
    const matching = supportRequests.find(
      (r) =>
        (r.groupId === group.id || r.group_id === group.id) &&
        r.status === 'pending'
    ) || supportRequests.find((r) => r.status === 'pending') || {
      id: `req-fallback-${group.id}`,
      topic: 'Checkpoint 3: Golden Set Benchmark & Prompt (CP3)',
      question: `Nhóm ${group.name} đang gặp khó khăn khi triển khai task và cần Coach hướng dẫn trực tiếp.`,
      urgent: Boolean(group.blocked),
      status: 'pending',
      createdAt: new Date().toISOString(),
      sender: { name: `Nhóm trưởng ${group.name}` },
    };

    setSelectedRequest(matching);
    setDialogOpen(true);
  };

  const handleResolved = async () => {
    await reload();
    await loadRequests();
    setDialogOpen(false);
  };

  return (
    <main className="page-shell coach-shell">
      <header className="page-heading">
        <div>
          <p className="eyebrow">LAB COACH · E403</p>
          <h1>TIẾN ĐỘ <span>NHÓM LAB</span></h1>
          <p>Chỉ hiển thị trạng thái cấp nhóm và yêu cầu hỗ trợ.</p>
        </div>
      </header>
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
            <div className="coach-row header">
              <span>Nhóm</span>
              <span>Checklist</span>
              <span>Blocked</span>
              <span>Check-in gần nhất</span>
              <span>Hỗ trợ</span>
            </div>
            {data.groups.map((group) => {
              const hasHelp = group.help === 'pending' || supportRequests.some(
                (r) => (r.groupId === group.id || r.group_id === group.id) && r.status === 'pending'
              );

              return (
                <div className={`coach-row ${group.name === 'Sloppers' ? 'highlighted' : ''}`} key={group.id}>
                  <span><b>{group.name}</b><small>{group.code}</small></span>
                  <span><i className="mini-progress"><em style={{ width: `${group.progress}%` }} /></i><b>{group.progress}%</b></span>
                  <span className={group.blocked ? 'warning' : ''}>{group.blocked} task</span>
                  <span>{group.lastCheckIn}</span>
                  <span>
                    {hasHelp ? (
                      <button
                        type="button"
                        className="danger-outline coach-btn-req-pending"
                        onClick={() => handleOpenRequest(group)}
                      >
                        ⚠️ Xem yêu cầu
                      </button>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
              );
            })}
          </section>
        </>
      )}

      <CoachResponseDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        group={selectedGroup}
        request={selectedRequest}
        onResolved={handleResolved}
        apiClient={apiClient}
      />
    </main>
  );
}

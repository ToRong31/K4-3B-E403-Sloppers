import { useCallback } from 'react';
import { Link } from 'react-router-dom';

import { apiClient } from '../../api/createApiClient';
import { ErrorState, LoadingState } from '../../components/PageState';
import { useAsyncResource } from '../../hooks/useAsyncResource';

export function LabsPage() {
  const loader = useCallback(() => apiClient.getLabs(), []);
  const { status, data: labs, error, reload } = useAsyncResource(loader);

  return (
    <main className="page-shell">
      <header className="page-heading">
        <div><p className="eyebrow">L3–L4 · KHÓA 4 PHASE 1</p><h1>BÀI LAB <span>CỦA TÔI</span></h1></div>
        <span className="count-badge">{labs?.length ?? 0} bài đang hiển thị</span>
      </header>

      <section className="stats-grid" aria-label="Thống kê bài Lab">
        <article><span className="stat-icon green">✓</span><div><small>Đã nộp</small><strong>4/7 bài</strong></div></article>
        <article><span className="stat-icon blue">◌</span><div><small>Đang làm</small><strong>1 bài</strong></div></article>
        <article><span className="stat-icon red">⇧</span><div><small>Cần nộp</small><strong>2 bài</strong></div></article>
      </section>

      {status === 'loading' && <LoadingState />}
      {status === 'error' && <ErrorState message={error.message} onRetry={reload} />}
      {status === 'ready' && (
        <section className="lab-list">
          {labs.map((lab) => (
            <article className="lab-card featured" key={lab.id}>
              <div className="lab-card-main">
                <span className="team-badge">Có LabSpace</span>
                <small>{lab.course}</small>
                <h2>{lab.title}</h2>
                <p>{lab.description}</p>
              </div>
              <div className="lab-progress">
                <b>{lab.progress}%</b>
                <span><i style={{ width: `${lab.progress}%` }} /></span>
                <small>{lab.updatedAt}</small>
              </div>
              <Link className="primary-button" to={`/labs/${lab.id}`}>Mở bài Hackathon</Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

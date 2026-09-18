import { useState } from 'react';
import { Link } from 'react-router-dom';
import labManifest from '../../api/labManifest.json';

const referenceLookup = new Map();

for (const cp of labManifest.checkpoints || []) {
  for (const item of cp.items || []) {
    if (item.ref_id) {
      referenceLookup.set(item.ref_id, {
        checkpointId: cp.checkpoint_id,
        checkpointOrder: cp.checkpoint_order,
        checkpointTitle: cp.title,
        checkpointTag: cp.checkpoint_id.toUpperCase(),
        itemId: item.item_id,
        itemTitle: item.title,
        itemContent: item.content,
        sourceType: item.source_type,
        refId: item.ref_id,
        lessonUrl: `/labs/k4-l3b-day05-06?lesson=${cp.checkpoint_id}`,
      });
    }
  }
}

export function resolveLabReference(refId) {
  if (!refId) return null;
  if (referenceLookup.has(refId)) {
    return referenceLookup.get(refId);
  }

  // Fallback parsing for URI format lab://<lab_id>/v<ver>/<cp>/<item>
  try {
    const stripped = refId.replace(/^lab:\/\//, '');
    const parts = stripped.split('/');
    if (parts.length >= 4) {
      const cpId = parts[2];
      const itId = parts.slice(3).join('/');
      return {
        checkpointId: cpId,
        checkpointOrder: null,
        checkpointTitle: `Checkpoint ${cpId.toUpperCase()}`,
        checkpointTag: cpId.toUpperCase(),
        itemId: itId,
        itemTitle: itId.replace(/[-_]/g, ' '),
        itemContent: '',
        sourceType: 'requirement',
        refId,
        lessonUrl: `/labs/k4-l3b-day05-06?lesson=${cpId}`,
      };
    }
  } catch {}

  return {
    checkpointId: 'CANONICAL',
    checkpointOrder: null,
    checkpointTitle: 'Bài Lab',
    checkpointTag: 'LAB',
    itemId: refId,
    itemTitle: refId,
    itemContent: '',
    sourceType: 'requirement',
    refId,
    lessonUrl: '/labs/k4-l3b-day05-06',
  };
}

export function LabReferenceBadge({ references = [], showDetailsToggle = true }) {
  const [expanded, setExpanded] = useState(false);

  if (!references || references.length === 0) {
    return null;
  }

  const resolvedList = references.map(resolveLabReference).filter(Boolean);
  if (resolvedList.length === 0) return null;

  return (
    <div className="task-ref-container">
      <div className="task-ref-badges">
        {resolvedList.map((ref) => (
          <span
            key={ref.refId}
            className="task-ref-chip"
            title={`Yêu cầu đề bài:\n${ref.itemContent || ref.itemTitle}\n\nRef URI: ${ref.refId}`}
          >
            <span className="ref-icon" aria-hidden="true">📌</span>
            <span className="ref-name">
              <b>{ref.checkpointTag}:</b> {ref.itemTitle}
            </span>
            <Link
              to={ref.lessonUrl}
              className="task-ref-link"
              title="Mở nội dung trong bài Lab để kiểm tra"
              onClick={(e) => e.stopPropagation()}
            >
              ↗
            </Link>
          </span>
        ))}
        {showDetailsToggle && resolvedList.some((r) => r.itemContent) && (
          <button
            type="button"
            className="task-ref-toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            aria-label={expanded ? 'Đóng đối soát đề bài' : 'Mở đối soát đề bài'}
          >
            {expanded ? '▴ Thu gọn' : '▾ Đối soát đề bài'}
          </button>
        )}
      </div>

      {expanded && (
        <div className="task-ref-detail-card" onClick={(e) => e.stopPropagation()}>
          {resolvedList.map((ref) => (
            <div key={ref.refId} style={{ marginBottom: resolvedList.length > 1 ? '8px' : '0' }}>
              <div className="task-ref-detail-header">
                <span>📖 {ref.checkpointTitle}</span>
                <span className="ref-tag">{ref.sourceType?.toUpperCase()}</span>
              </div>
              <p className="task-ref-detail-content">
                {ref.itemContent || 'Không có mô tả chi tiết.'}
              </p>
              <div className="task-ref-detail-footer">
                <code style={{ fontSize: '9.5px', color: '#64748b' }}>{ref.refId}</code>
                <Link to={ref.lessonUrl} className="task-ref-link">
                  Mở bài học {ref.checkpointTag} ↗
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

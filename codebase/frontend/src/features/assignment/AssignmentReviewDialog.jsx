import { useEffect, useMemo, useRef, useState } from 'react';

const proposalByTaskId = {
  t1: { owner: 'Trọng', confidence: 95, reason: 'Sở trường Product & Research' },
  t2: { owner: 'Trọng', confidence: 98, reason: 'Kinh nghiệm Product Lead' },
  t3: { owner: 'Trang', confidence: 96, reason: 'Frontend + UI/UX' },
  t4: { owner: 'Dương', confidence: 94, reason: 'AI / Golden set' },
  t5: { owner: 'Dũng', confidence: 92, reason: 'Backend + Data' },
};

const analysisLogs = [
  { percent: 12, icon: '🔍', text: 'Đọc 5 deliverable từ checklist chính thức…' },
  { percent: 38, icon: '👥', text: 'Đối chiếu hồ sơ kỹ năng thành viên…' },
  { percent: 67, icon: '🧠', text: 'Tính confidence và cân bằng khối lượng…' },
  { percent: 88, icon: '⚠️', text: 'Kiểm tra các khoảng trống kỹ năng…' },
  { percent: 100, icon: '✨', text: 'Bản nháp đã sẵn sàng để Nhóm trưởng kiểm tra.' },
];

export function buildDraftAssignments(tasks, draftAssignments, members = []) {
  if (draftAssignments) {
    const taskById = new Map(tasks.map((task) => [task.id, task]));
    const memberById = new Map(members.map((member) => [member.id, member]));
    return draftAssignments.map((assignment) => {
      const task = taskById.get(assignment.task_id);
      const owner = memberById.get(assignment.owner_id);
      return {
        taskId: assignment.task_id,
        title: task?.title ?? 'Task không xác định',
        category: task?.category ?? 'TASK',
        proposedOwner: owner?.name ?? assignment.owner_id,
        owner: owner?.name ?? assignment.owner_id,
        confidence: assignment.confidence === 'high' ? 95 : assignment.confidence === 'medium' ? 75 : 45,
        reason: assignment.reason,
        matchedSkills: assignment.matched_skills ?? [],
      };
    });
  }
  return tasks.map((task) => ({
    taskId: task.id,
    title: task.title,
    category: task.category,
    proposedOwner: proposalByTaskId[task.id]?.owner ?? task.owner,
    owner: proposalByTaskId[task.id]?.owner ?? task.owner,
    confidence: proposalByTaskId[task.id]?.confidence ?? 75,
    reason: proposalByTaskId[task.id]?.reason ?? 'Khớp với phần việc hiện có',
  }));
}

export function calculateWorkload(assignments) {
  return assignments.reduce((workload, item) => ({ ...workload, [item.owner]: (workload[item.owner] ?? 0) + 1 }), {});
}

export function AssignmentReviewDialog({ members, onApprove, onClose, onGenerateDraft, open, tasks }) {
  const dialogRef = useRef(null);
  const latestTasksRef = useRef(tasks);
  const [phase, setPhase] = useState('analyzing');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [draftVersion, setDraftVersion] = useState(1);
  const [assignments, setAssignments] = useState(() => buildDraftAssignments(tasks));
  const [draftStatus, setDraftStatus] = useState('ready');
  const [gaps, setGaps] = useState([]);
  const [draftError, setDraftError] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    latestTasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    if (!open) return undefined;
    setPhase('analyzing');
    setProgress(0);
    setLogs([]);
    setAssignments([]);
    setDraftStatus('ready');
    setGaps([]);
    setDraftError('');
    setDraftLoading(true);
    return undefined;
  }, [draftVersion, open]);

  useEffect(() => {
    if (!open || !onGenerateDraft) return undefined;
    let active = true;
    onGenerateDraft()
      .then((draft) => {
        if (!active) return;
        setDraftStatus(draft.status);
        setGaps(draft.gaps ?? []);
        setAssignments(buildDraftAssignments(latestTasksRef.current, draft.assignments, members));
        setDraftLoading(false);
      })
      .catch((error) => {
        if (active) {
          setDraftError(error.message ?? 'Không thể tạo bản nháp AI.');
          setDraftLoading(false);
        }
      });
    return () => { active = false; };
  }, [draftVersion, members, onGenerateDraft, open]);

  useEffect(() => {
    if (!open || phase !== 'analyzing') return undefined;
    const timers = analysisLogs.map((entry, index) => window.setTimeout(() => {
      setProgress(entry.percent);
      setLogs((current) => [...current, entry]);
      if (index === analysisLogs.length - 1) window.setTimeout(() => setPhase('review'), 260);
    }, index * 330));
    return () => timers.forEach(window.clearTimeout);
  }, [open, phase]);

  const workload = useMemo(() => calculateWorkload(assignments), [assignments]);
  const ownerChoices = members.filter((member) => member.status !== 'declined').map((member) => member.name);
  const changedCount = assignments.filter((item) => item.owner !== item.proposedOwner).length;
  const workloadCounts = ownerChoices.map((name) => workload[name] ?? 0);
  const workloadGap = Math.max(...workloadCounts, 0) - Math.min(...workloadCounts, 0);
  const workloadImbalanced = workloadGap > 1;
  const canApprove = !draftLoading && draftStatus === 'ready' && !draftError && assignments.length === tasks.length;

  const closeDialog = () => {
    onClose();
  };

  const skipAnalysis = () => {
    setProgress(100);
    setLogs(analysisLogs);
    setPhase('review');
  };

  const regenerate = () => setDraftVersion((version) => version + 1);

  const selectOwner = (taskId, owner) => {
    setAssignments((current) => current.map((item) => item.taskId === taskId ? { ...item, owner } : item));
  };

  const approve = () => {
    onApprove(assignments);
    setPhase('approved');
  };

  return (
    <dialog ref={dialogRef} className="assignment-review-dialog" onClose={onClose} onCancel={closeDialog} aria-labelledby="assignment-review-title">
      <header className="group-dialog-header">
        <div><span>LABSPACE · AI DRAFT ASSIGNMENT · FRONTEND DEMO</span><h2 id="assignment-review-title">Phân chia task với AI</h2></div>
        <button type="button" onClick={closeDialog} aria-label="Đóng bản nháp AI">×</button>
      </header>

      <div className="assignment-stages" aria-label="Tiến trình bản nháp">
        <span className={phase === 'analyzing' ? 'active' : 'complete'}>1. AI phân tích & tạo nháp</span>
        <span className={phase === 'review' || phase === 'confirm' ? 'active' : phase === 'approved' ? 'complete' : ''}>2. Nhóm trưởng kiểm tra & chỉnh sửa</span>
        <span className={phase === 'confirm' ? 'active' : phase === 'approved' ? 'complete' : ''}>3. Phê duyệt chính thức</span>
      </div>

      {phase === 'analyzing' && (
        <section className="assignment-analyzing">
          <div className="ai-orb" aria-hidden="true">✦</div>
          <h3>AI đang phân tích ma trận kỹ năng & bài Lab…</h3>
          <p>Đang đối soát checklist và hồ sơ kỹ năng tự khai của nhóm.</p>
          <div className="ai-progress"><i style={{ width: `${progress}%` }} /></div>
          <div className="ai-progress-meta"><span>{logs.at(-1)?.text ?? 'Đang khởi động AI matching engine…'}</span><b>{progress}%</b></div>
          <div className="ai-log-list">{logs.map((entry) => <p key={entry.percent}><span>{entry.icon}</span>{entry.text}</p>)}</div>
          <button className="text-button" type="button" onClick={skipAnalysis}>Xem kết quả ngay (bỏ qua animation) →</button>
        </section>
      )}

      {phase === 'review' && (
        <section className="assignment-review-body">
          <div className="ai-summary-card"><span>✦</span><div><b>AI đã tạo bản nháp gợi ý · phiên bản {draftVersion}</b><p>Nhóm trưởng có thể đổi bất kỳ owner nào. Task chỉ chính thức khi bạn phê duyệt.</p></div></div>
          {draftLoading ? <div className="ai-output-status ready"><b>… ĐANG CHỜ BACKEND</b><span>Chưa có bản nháp để hiển thị.</span></div>
            : draftError ? <div className="ai-output-status clarify"><b>⚠ LỖI</b><span>{draftError}</span></div>
            : draftStatus === 'clarify' ? <div className="ai-output-status clarify"><b>⚠ CLARIFY</b><span>{gaps.join(' ')}</span></div>
              : <div className="ai-output-status ready"><b>✓ READY</b><span>Bản nháp được tạo từ endpoint `assign_tasks`; Leader có thể kiểm tra và chỉnh sửa.</span></div>}
          <div className="ai-human-boundary">⚖️ <span><b>Ranh giới AI & con người:</b> AI đề xuất dựa trên dữ liệu demo. Quyết định cuối cùng và trách nhiệm phân công thuộc về Nhóm trưởng.</span></div>
          <div className="assignment-task-list">
            {assignments.map((item) => {
              const overridden = item.owner !== item.proposedOwner;
              return (
                <article className={overridden ? 'overridden' : ''} key={item.taskId}>
                  <div><span className="task-tag">{item.category}</span><h3>{item.title}</h3><p>🤖 AI đề xuất: <b>{item.proposedOwner}</b> · {item.reason} · Match {item.confidence}%</p>{item.confidence < 93 && <small className="low-confidence">Cần kiểm tra lại: confidence dưới 93%.</small>}{overridden && <small>Leader đã đổi từ {item.proposedOwner} → {item.owner}</small>}</div>
                  <label><span className="sr-only">Người phụ trách cho {item.title}</span><select value={item.owner} onChange={(event) => selectOwner(item.taskId, event.target.value)}>{ownerChoices.map((name) => <option key={name} value={name}>{name}</option>)}<option value="Cả nhóm">Cả nhóm</option></select></label>
                </article>
              );
            })}
          </div>
          <div className="assignment-insights">
            {gaps.map((gap) => <div key={gap}>⚠️ <span><b>Skill gap:</b> {gap}</span></div>)}
            <div>⚖️ <span><b>Khối lượng hiện tại:</b> {Object.entries(workload).map(([owner, count]) => `${owner} ${count} task`).join(' · ')}.</span></div>
          </div>
          {workloadImbalanced && <p className="workload-warning">⚠ Cảnh báo workload: chênh lệch đang là {workloadGap} task giữa các thành viên. Hãy cân nhắc cân bằng lại trước khi phê duyệt.</p>}
          {changedCount > 0 && <p className="assignment-audit">Đã ghi nhận {changedCount} thay đổi do Leader thực hiện trong UI demo.</p>}
          <footer className="group-dialog-actions"><button className="secondary-button" type="button" onClick={regenerate}>↻ Tạo lại bản nháp</button><button className="primary-button" type="button" disabled={!canApprove} onClick={() => setPhase('confirm')}>Phê duyệt phân công này →</button></footer>
        </section>
      )}

      {phase === 'confirm' && (
        <section className="assignment-confirm">
          <span className="confirm-icon">!</span>
          <h3>Xác nhận phê duyệt kế hoạch?</h3>
          <p>{assignments.length} task sẽ được cập nhật owner trên board sau khi bạn xác nhận. Bản nháp AI chưa tự thay đổi task.</p>
          <div className="assignment-confirm-list">{assignments.map((item) => <span key={item.taskId}><b>{item.title}</b><em>{item.owner}</em></span>)}</div>
          <footer className="group-dialog-actions"><button className="secondary-button" type="button" onClick={() => setPhase('review')}>← Quay lại</button><button className="primary-button" type="button" onClick={approve}>✓ Xác nhận phê duyệt</button></footer>
        </section>
      )}

      {phase === 'approved' && (
        <section className="group-created-state">
          <span className="group-created-check">✓</span><h3>Kế hoạch đã được phê duyệt</h3><p>Owner của các task đã được cập nhật vào board UI.</p>
          <div className="leader-setup-notice">Bản nháp đã được lấy từ backend. Việc lưu chính thức và audit log sẽ được tích hợp ở operation phê duyệt riêng.</div>
          <footer className="group-dialog-actions"><button className="primary-button" type="button" onClick={closeDialog}>Về LabSpace →</button></footer>
        </section>
      )}
    </dialog>
  );
}

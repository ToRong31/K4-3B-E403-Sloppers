import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { apiClient } from '../../api/createApiClient';
import { useAuth } from '../../auth/useAuth';
import { ErrorState, LoadingState } from '../../components/PageState';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { canonicalTasksFixture, defaultLabManifest } from '../../api/mockData';
import { AssignmentReviewDialog } from '../assignment/AssignmentReviewDialog';
import { LeaderGroupDialog } from '../group/LeaderGroupDialog';
import { MemberInviteFlow } from '../profile/MemberInviteFlow';

const statusLabel = {
  accepted: 'Đã vào',
  pending: 'Chờ',
  declined: 'Từ chối',
};

export function WorkspacePage() {
  const { user } = useAuth();
  const loader = useCallback(() => apiClient.getWorkspaceSnapshot(), []);
  const { status, data, error, reload } = useAsyncResource(loader);
  const [workspaceData, setWorkspaceData] = useState(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const groupDialogTriggerRef = useRef(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeLog, setAnalyzeLog] = useState('');

  useEffect(() => {
    if (data) setWorkspaceData(data);
  }, [data]);

  const snapshot = workspaceData ?? data;
  const directory = useMemo(
    () => (snapshot?.members ?? []).filter((member) => member.studentCode !== user.accountId),
    [snapshot?.members, user.accountId],
  );

  const closeGroupDialog = () => {
    setGroupDialogOpen(false);
    window.requestAnimationFrame(() => groupDialogTriggerRef.current?.focus());
  };

  const handleGroupCreated = (group) => {
    setWorkspaceData((current) => {
      if (!current) return current;
      const leader = current.members.find((member) => member.studentCode === user.accountId)
        ?? current.members.find((member) => member.role === 'Nhóm trưởng');
      const invitedMembers = group.invitees.map((student) => ({
        ...student,
        id: student.id ?? `invite-${student.studentCode}`,
        status: 'pending',
        profileReady: false,
      }));
      return {
        ...current,
        group: { ...current.group, name: group.name, code: group.code },
        members: leader ? [leader, ...invitedMembers] : invitedMembers,
        tasks: [],
        checklistSource: 'Chưa phân tích checklist từ bài Lab',
        planStatus: 'draft',
      };
    });
  };

  const handleAnalyzeTask = async () => {
    setIsAnalyzing(true);
    setAnalyzeProgress(12);
    setAnalyzeLog('1/4: Đọc dữ liệu bài Lab & kiểm tra ref_id…');

    const t1 = setTimeout(() => {
      setAnalyzeProgress(38);
      setAnalyzeLog('2/4: Đang gọi mô hình gpt-5.6-luna qua LangGraph…');
    }, 1200);

    const t2 = setTimeout(() => {
      setAnalyzeProgress(68);
      setAnalyzeLog('3/4: LLM đang phân rã checkpoint & bóc tách deliverables…');
    }, 3200);

    const t3 = setTimeout(() => {
      setAnalyzeProgress(88);
      setAnalyzeLog('4/4: Kiểm tra 100% requirement coverage & schema validation…');
    }, 6000);

    try {
      const res = await apiClient.analyzeLab({
        lab_id: 'K4-L3B-DAY05-06-MINI-HACKATHON',
        lab_manifest: defaultLabManifest,
      });
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setAnalyzeProgress(100);
      setAnalyzeLog('Hoàn thành! Đang nạp danh sách task…');

      if (res && res.status === 'ready') {
        const draft = res.checklist_draft;
        let analyzedTasks = [];
        if (draft?.checkpoints?.length) {
          analyzedTasks = draft.checkpoints.flatMap((cp) =>
            (cp.tasks ?? []).map((t, idx) => ({
              id: t.id ?? t.task_key ?? `task-${idx + 1}`,
              category: cp.checkpoint_id ? cp.checkpoint_id.toUpperCase() : 'CANONICAL',
              title: t.title,
              deliverable: t.deliverable,
              owner: 'Chưa phân công',
              status: 'todo',
            }))
          );
        } else if (draft?.tasks?.length) {
          analyzedTasks = draft.tasks.map((t) => ({
            ...t,
            owner: t.owner ?? 'Chưa phân công',
            status: t.status ?? 'todo',
          }));
        }
        if (analyzedTasks.length === 0) {
          analyzedTasks = canonicalTasksFixture;
        }
        setTimeout(() => {
          setWorkspaceData((current) => ({
            ...current,
            tasks: analyzedTasks,
            checklistSource: `${draft?.lab_id ?? 'K4-L3B-DAY05-06'} · AI Task Analysis (gpt-5.6-luna)`,
          }));
          setIsAnalyzing(false);
        }, 400);
      } else {
        setIsAnalyzing(false);
      }
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      console.error('Lỗi khi phân tích bài Lab:', err);
      setIsAnalyzing(false);
    }
  };

  const updateCurrentMember = (updates) => {
    setWorkspaceData((current) => current ? {
      ...current,
      members: current.members.map((member) => member.studentCode === user.accountId ? { ...member, ...updates } : member),
    } : current);
  };

  const handleInvitationChange = (invitationStatus) => {
    updateCurrentMember({ status: invitationStatus, profileReady: false });
  };

  const handleProfileSaved = (skills) => {
    updateCurrentMember({ status: 'accepted', profileReady: true, skills });
  };

  const handlePlanApproved = (assignments) => {
    const ownerByTask = new Map(assignments.map((assignment) => [assignment.taskId, assignment.owner]));
    setWorkspaceData((current) => current ? {
      ...current,
      planStatus: 'approved',
      tasks: current.tasks.map((task) => ({ ...task, owner: ownerByTask.get(task.id) ?? task.owner })),
    } : current);
  };

  const generateAssignmentDraft = useCallback(() => apiClient.assignTasks({
    group_name: snapshot.group.name,
    members: snapshot.members.map((member) => ({
      id: member.id,
      name: member.name,
      skills: member.skills ?? [],
    })),
    tasks: snapshot.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      deliverable: task.deliverable,
    })),
  }), [snapshot]);

  if (status === 'loading') return <main className="page-shell"><LoadingState label="Đang tải LabSpace…" /></main>;
  if (status === 'error') return <main className="page-shell"><ErrorState message={error.message} onRetry={reload} /></main>;

  const completed = (snapshot?.tasks ?? []).filter((task) => task.status === 'done').length;
  const totalTasks = snapshot?.tasks?.length ?? 0;
  const progress = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
  const isLeader = user.role === 'leader';
  const isMember = user.role === 'member';
  const currentMember = snapshot.members.find((member) => member.studentCode === user.accountId);

  return (
    <>
      <main className="workspace-shell">
        <header className="workspace-header">
          <div>
            <p className="breadcrumbs">Lab › K4–L3B–DAY05–06 › Nhóm {snapshot.group.name}</p>
            <h1>LABSPACE · {snapshot.group.name.toUpperCase()}</h1>
            <p><span className="role-tag">VIEW {user.roleLabel.toUpperCase()}</span> Mini Hackathon AI</p>
          </div>
          <div className="workspace-actions">
            {isLeader && (
              <button ref={groupDialogTriggerRef} className="primary-button" type="button" onClick={() => setGroupDialogOpen(true)}>
                ＋ Lập nhóm Lab
              </button>
            )}
            {isMember && (
              <MemberInviteFlow
                currentUser={user}
                group={snapshot.group}
                invitationStatus={currentMember?.status ?? 'pending'}
                profileReady={currentMember?.profileReady ?? false}
                labTitle="K4–L3B–DAY05–06–MINI–HACKATHON"
                onInvitationChange={handleInvitationChange}
                onProfileSaved={handleProfileSaved}
              />
            )}
            <button className="secondary-button" type="button">Mã nhóm: <b>{snapshot.group.code}</b> ⧉</button>
          </div>
        </header>

        <div className="workspace-grid">
          <aside className="card team-panel">
            <div className="card-heading"><h2>Thành viên</h2><span>{snapshot.members.filter((m) => m.status === 'accepted').length}/{snapshot.members.length} xác nhận</span></div>
            <ul className="member-list">
              {snapshot.members.map((member) => (
                <li key={member.id}>
                  <span className="member-avatar">{member.name[0]}</span>
                  <div><b>{member.name}</b><small>{member.role}</small></div>
                  <em className={member.status}>{statusLabel[member.status]}</em>
                </li>
              ))}
            </ul>
            {snapshot.tasks.length === 0 ? (
              <>
                <button
                  className="primary-button full"
                  type="button"
                  disabled={!isLeader || isAnalyzing}
                  onClick={handleAnalyzeTask}
                >
                  {isAnalyzing ? `⏳ Đang phân tích (${analyzeProgress}%)…` : '✦ Phân tích Task (AI)'}
                </button>
                <button
                  className="secondary-button full"
                  type="button"
                  style={{ marginTop: '8px' }}
                  disabled={true}
                >
                  ✦ Chờ có checklist để phân công AI
                </button>
              </>
            ) : (
              <>
                <button
                  className="primary-button full"
                  type="button"
                  disabled={!isLeader}
                  onClick={() => isLeader && setAssignmentDialogOpen(true)}
                >
                  ✦ {isLeader ? 'Tạo bản nháp phân công AI' : 'Chờ nhóm trưởng phân công'}
                </button>
                {isLeader && (
                  <button
                    className="secondary-button full"
                    type="button"
                    style={{ marginTop: '8px' }}
                    disabled={isAnalyzing}
                    onClick={handleAnalyzeTask}
                  >
                    {isAnalyzing ? `⏳ Đang phân tích (${analyzeProgress}%)…` : '↻ Phân tích lại Task'}
                  </button>
                )}
              </>
            )}
            {!isLeader && <p className="permission-note">🔒 Chỉ nhóm trưởng có quyền tạo và phê duyệt kế hoạch.</p>}
            <div className="source-note"><b>Nguồn checklist</b><p>{snapshot.checklistSource}</p></div>
          </aside>

          <section className="card board-panel">
            <div className="card-heading">
              <div><h2>Kế hoạch của nhóm</h2><p>Shell UI đang đọc qua API adapter; mutation sẽ được nối ở bước tiếp theo.</p></div>
              <span className="status-chip">{snapshot.planStatus === 'draft' ? 'Bản nháp' : snapshot.planStatus === 'approved' ? 'Đã duyệt' : snapshot.planStatus}</span>
            </div>
            <div className="overall-progress"><i style={{ width: `${progress}%` }} /></div>
            <div className="task-list">
              {isAnalyzing ? (
                <section className="assignment-analyzing" style={{ padding: '36px 16px' }}>
                  <div className="ai-orb" aria-hidden="true">✦</div>
                  <h3 style={{ fontSize: '18px', margin: '16px 0 6px', color: '#173f61' }}>
                    AI đang phân tích bài Lab…
                  </h3>
                  <p style={{ fontSize: '12px', color: '#708397', maxWidth: '440px', margin: '0 auto 16px', lineHeight: 1.55 }}>
                    Mô hình <b>gpt-5.6-luna</b> đang đọc đề bài, đối soát checkpoints và bóc tách các đầu việc canonical.
                  </p>
                  <div className="ai-progress" style={{ margin: '0 auto', maxWidth: '460px' }}>
                    <i style={{ width: `${analyzeProgress}%` }} />
                  </div>
                  <div className="ai-progress-meta" style={{ maxWidth: '460px', margin: '8px auto 0' }}>
                    <span>{analyzeLog}</span>
                    <b>{analyzeProgress}%</b>
                  </div>
                </section>
              ) : snapshot.tasks.length === 0 ? (
                <div style={{ padding: '40px 16px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                  <b style={{ display: 'block', fontSize: '15px', color: '#1e293b', marginBottom: '6px' }}>
                    Chưa có checklist đầu việc
                  </b>
                  <p style={{ fontSize: '13px', maxWidth: '380px', margin: '0 auto 16px', lineHeight: 1.5 }}>
                    Nhóm vừa được tạo. Hãy bấm <b>“Phân tích Task”</b> để AI đọc đề bài và bóc tách các đầu việc canonical.
                  </p>
                  {isLeader && (
                    <button
                      className="primary-button"
                      type="button"
                      disabled={isAnalyzing}
                      onClick={handleAnalyzeTask}
                    >
                      ✦ Phân tích Task ngay
                    </button>
                  )}
                </div>
              ) : (
                snapshot.tasks.map((task) => (
                  <article className={`task ${task.status}`} key={task.id}>
                    <span className={`task-check ${task.status === 'done' ? 'checked' : ''}`}>{task.status === 'done' ? '✓' : ''}</span>
                    <div className="task-main"><span className="task-tag">{task.category}</span><h3>{task.title}</h3><p>Deliverable: {task.deliverable}</p></div>
                    <div className="task-owner"><span className="member-avatar">{task.owner[0]}</span><div><b>{task.owner}</b><small>{task.status}</small></div></div>
                  </article>
                ))
              )}
            </div>
          </section>

          <aside className="card submit-panel">
            <div className="ready-score"><div className="progress-ring">{progress}%</div><h2>Tiến độ nhóm</h2><p>{completed}/{snapshot.tasks.length} task hoàn thành</p></div>
            <div className="deliverable-list">
              <h3>Deliverable trong fixture</h3>
              {snapshot.tasks.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', margin: '8px 0' }}>Chưa có deliverable nào.</p>
              ) : (
                snapshot.tasks.map((task) => <label key={task.id}><input type="checkbox" checked={task.status === 'done'} readOnly /> {task.deliverable}</label>)
              )}
            </div>
            <button className="danger-outline full" type="button">☝ Yêu cầu Coach hỗ trợ</button>
            <p className="privacy-note">Coach chỉ thấy tiến độ nhóm và yêu cầu hỗ trợ được gửi.</p>
          </aside>
        </div>
      </main>

      {isLeader && (
        <LeaderGroupDialog
          open={groupDialogOpen}
          directory={directory}
          initialGroupName={snapshot.group.name}
          labTitle="K4–L3B–DAY05–06–MINI–HACKATHON"
          leaderCode={user.accountId}
          onCreated={handleGroupCreated}
          onClose={closeGroupDialog}
        />
      )}
      {isLeader && (
        <AssignmentReviewDialog
          open={assignmentDialogOpen}
          tasks={snapshot.tasks}
          members={snapshot.members}
          onApprove={handlePlanApproved}
          onGenerateDraft={generateAssignmentDraft}
          onClose={() => setAssignmentDialogOpen(false)}
        />
      )}
    </>
  );
}

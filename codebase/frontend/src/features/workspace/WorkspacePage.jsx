import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { apiClient } from '../../api/createApiClient';
import { useAuth } from '../../auth/useAuth';
import { ErrorState, LoadingState } from '../../components/PageState';
import { useAsyncResource } from '../../hooks/useAsyncResource';
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
      };
    });
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

  if (status === 'loading') return <main className="page-shell"><LoadingState label="Đang tải LabSpace…" /></main>;
  if (status === 'error') return <main className="page-shell"><ErrorState message={error.message} onRetry={reload} /></main>;

  const completed = snapshot.tasks.filter((task) => task.status === 'done').length;
  const progress = Math.round((completed / snapshot.tasks.length) * 100);
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
            <button className="primary-button full" type="button" disabled={!isLeader} onClick={() => isLeader && setAssignmentDialogOpen(true)}>
              ✦ {isLeader ? 'Tạo bản nháp phân công AI' : 'Chờ nhóm trưởng phân công'}
            </button>
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
              {snapshot.tasks.map((task) => (
                <article className={`task ${task.status}`} key={task.id}>
                  <span className={`task-check ${task.status === 'done' ? 'checked' : ''}`}>{task.status === 'done' ? '✓' : ''}</span>
                  <div className="task-main"><span className="task-tag">{task.category}</span><h3>{task.title}</h3><p>Deliverable: {task.deliverable}</p></div>
                  <div className="task-owner"><span className="member-avatar">{task.owner[0]}</span><div><b>{task.owner}</b><small>{task.status}</small></div></div>
                </article>
              ))}
            </div>
          </section>

          <aside className="card submit-panel">
            <div className="ready-score"><div className="progress-ring">{progress}%</div><h2>Tiến độ nhóm</h2><p>{completed}/{snapshot.tasks.length} task hoàn thành</p></div>
            <div className="deliverable-list">
              <h3>Deliverable trong fixture</h3>
              {snapshot.tasks.map((task) => <label key={task.id}><input type="checkbox" checked={task.status === 'done'} readOnly /> {task.deliverable}</label>)}
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
          onClose={() => setAssignmentDialogOpen(false)}
        />
      )}
    </>
  );
}

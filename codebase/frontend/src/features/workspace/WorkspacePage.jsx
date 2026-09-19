import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { apiClient } from '../../api/createApiClient';
import { useAuth } from '../../auth/useAuth';
import { ErrorState, LoadingState } from '../../components/PageState';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { canonicalTasksFixture, defaultLabManifest } from '../../api/mockData';
import { AssignmentReviewDialog } from '../assignment/AssignmentReviewDialog';
import { LeaderGroupDialog } from '../group/LeaderGroupDialog';
import { MemberInviteFlow, MemberSkillProfileDialog } from '../profile/MemberInviteFlow';
import { PrivateProgressChat } from '../progress/PrivateProgressChat';
import { LabReferenceBadge } from '../labs/LabReferenceBadge';

const statusLabel = {
  accepted: 'Đã vào',
  pending: 'Chờ',
  declined: 'Từ chối',
};

export function WorkspacePage({ labId: propLabId, currentLabId: propCurrentLabId } = {}) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
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
  const currentLabId = useMemo(() => {
    return (
      propCurrentLabId ||
      propLabId ||
      searchParams.get('labId') ||
      searchParams.get('lab_id') ||
      location.state?.labId ||
      location.state?.currentLabId ||
      snapshot?.labId ||
      snapshot?.lab_id ||
      snapshot?.group?.labId ||
      snapshot?.group?.lab_id ||
      'K4-L3B-DAY05-06-MINI-HACKATHON'
    );
  }, [propCurrentLabId, propLabId, searchParams, location.state, snapshot]);

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
    setAnalyzeProgress(10);
    setAnalyzeLog(`1/4: Nạp dữ liệu bài LAB [${currentLabId}] & kiểm tra ref_id…`);

    const steps = [
      { at: 2000, pct: 28, msg: '2/4: Đang gọi mô hình gpt-5.6-luna qua LangGraph task_analysis…' },
      { at: 6000, pct: 55, msg: '3/4: LLM đang bóc tách items & xác định deliverables…' },
      { at: 12000, pct: 75, msg: '3/4: LLM đang trích xuất completion_criteria & reference_ids…' },
      { at: 18000, pct: 88, msg: '3/4: LLM đang tối ưu hóa dependency graph…' },
      { at: 24000, pct: 94, msg: '4/4: Kiểm tra 100% requirement coverage & lưu canonical checklist…' },
    ];

    const timerIds = steps.map((s) =>
      setTimeout(() => {
        setAnalyzeProgress(s.pct);
        setAnalyzeLog(s.msg);
      }, s.at)
    );

    const clearAllTimers = () => timerIds.forEach(clearTimeout);

    try {
      const isDefaultLab = currentLabId === 'K4-L3B-DAY05-06-MINI-HACKATHON';
      const res = await apiClient.analyzeLab({
        lab_id: currentLabId,
        version: 1,
        ...(isDefaultLab ? { lab_manifest: defaultLabManifest } : {}),
      });
      clearAllTimers();

      if (res && res.status === 'ready') {
        setAnalyzeProgress(100);
        setAnalyzeLog('Hoàn thành! Đã phân tích thành công từ mô hình AI.');

        const draft = res.checklist_draft;
        let analyzedTasks = [];
        if (draft?.checkpoints?.length) {
          analyzedTasks = draft.checkpoints.flatMap((cp) =>
            (cp.tasks ?? []).map((t, idx) => ({
              ...t,
              id: t.id ?? t.task_key ?? `task-${idx + 1}`,
              category: cp.checkpoint_id ? cp.checkpoint_id.toUpperCase() : 'CANONICAL',
              checkpoint_id: t.checkpoint_id ?? cp.checkpoint_id,
              checkpoint_order: t.checkpoint_order ?? cp.checkpoint_order,
              task_order: t.task_order ?? idx + 1,
              owner: t.owner ?? t.owner_id ?? 'Chưa phân công',
              status: t.status === 'proposed' ? 'todo' : (t.status ?? 'todo'),
              reference_ids: t.reference_ids ?? [],
            }))
          );
        } else if (draft?.tasks?.length) {
          analyzedTasks = draft.tasks.map((t) => ({
            ...t,
            owner: t.owner ?? 'Chưa phân công',
            status: t.status ?? 'todo',
            reference_ids: t.reference_ids ?? [],
          }));
        }

        if (analyzedTasks.length === 0) {
          alert('Không tìm thấy task nào được tạo từ phản hồi AI.');
          setIsAnalyzing(false);
          return;
        }

        setTimeout(() => {
          setWorkspaceData((current) => ({
            ...current,
            tasks: analyzedTasks,
            checklistSource: `${draft?.lab_id ?? currentLabId} · AI Task Analysis (gpt-5.6-luna)`,
          }));
          setIsAnalyzing(false);
        }, 400);
      } else if (res && res.status === 'clarify') {
        const msg = res.gaps?.length ? res.gaps.join('\n') : 'Mô hình AI cần làm rõ thêm thông tin đề bài.';
        alert(`AI Clarification:\n${msg}`);
        setIsAnalyzing(false);
      } else {
        alert('Phân tích thất bại: Backend không trả về trạng thái ready.');
        setIsAnalyzing(false);
      }
    } catch (err) {
      clearAllTimers();
      console.error('Lỗi khi phân tích bài Lab:', err);
      alert(`Lỗi khi gọi AI phân tích bài Lab: ${err.message || err}`);
      setIsAnalyzing(false);
    }
  };

  const [editingMember, setEditingMember] = useState(null);

  const updateCurrentMember = (updates) => {
    setWorkspaceData((current) => current ? {
      ...current,
      members: current.members.map((member) => member.studentCode === user.accountId ? { ...member, ...updates } : member),
    } : current);
  };

  const handleInvitationChange = (invitationStatus) => {
    updateCurrentMember({ status: invitationStatus, profileReady: false });
  };

  const handleProfileSaved = (profileData) => {
    updateCurrentMember({
      status: 'accepted',
      profileReady: true,
      industry: profileData.industry,
      skills: profileData.skills,
      skillLevels: profileData.skillLevels,
      skillsWithLevel: profileData.skillsWithLevel,
    });
  };

  const handleSaveMemberSkills = (profileData) => {
    if (!editingMember) return;
    setWorkspaceData((current) => {
      if (!current) return current;
      return {
        ...current,
        members: current.members.map((m) =>
          m.id === editingMember.id
            ? {
                ...m,
                industry: profileData.industry,
                skills: profileData.skills,
                skillLevels: profileData.skillLevels,
                skillsWithLevel: profileData.skillsWithLevel,
                profileReady: true,
                status: 'accepted',
              }
            : m
        ),
      };
    });
  };

  const handlePlanApproved = (assignments) => {
    const ownerByTask = new Map(assignments.map((assignment) => [assignment.taskId, assignment.owner]));
    setWorkspaceData((current) => current ? {
      ...current,
      planStatus: 'approved',
      tasks: current.tasks.map((task) => ({ ...task, owner: ownerByTask.get(task.id) ?? task.owner })),
    } : current);
  };

  const generateAssignmentDraft = useCallback(() => {
    const payload = {
      group_name: snapshot.group.name,
      members: snapshot.members.map((member) => ({
        id: member.id,
        name: member.name,
        skills: member.skills ?? [],
      })),
    };
    if (snapshot.tasks && snapshot.tasks.length > 0) {
      payload.tasks = snapshot.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        deliverable: task.deliverable ?? '',
        description: task.description ?? '',
        required_skills: task.required_skills ?? [],
        checkpoint_id: task.checkpoint_id ?? null,
        depends_on: task.depends_on ?? [],
      }));
    } else {
      payload.lab_id = currentLabId;
      payload.version = 1;
    }
    return apiClient.assignTasks(payload);
  }, [snapshot, currentLabId]);

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
            <p className="breadcrumbs">Lab › {currentLabId} › Nhóm {snapshot.group.name}</p>
            <h1>LABSPACE · {snapshot.group.name.toUpperCase()}</h1>
            <p><span className="role-tag">VIEW {user.roleLabel.toUpperCase()}</span> Mini Hackathon AI</p>
          </div>
          <div className="workspace-actions">
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
                <li key={member.id} className="member-card-item">
                  <div className="member-item-main">
                    <span className="member-avatar">{member.name[0]}</span>
                    <div>
                      <b>{member.name}</b>
                      <small>{member.role}</small>
                    </div>
                    <em className={member.status}>{statusLabel[member.status]}</em>
                  </div>
                  {member.skillsWithLevel && member.skillsWithLevel.length > 0 ? (
                    <div className="member-skill-tags">
                      {member.skillsWithLevel.map((item) => (
                        <span key={item.skill} className="member-skill-badge" title={`${item.skill} · Mức độ ${item.level}/5`}>
                          {item.skill} <b>{item.level}/5</b>
                        </span>
                      ))}
                    </div>
                  ) : member.skills && member.skills.length > 0 ? (
                    <div className="member-skill-tags">
                      {member.skills.map((skill) => (
                        <span key={skill} className="member-skill-badge">
                          {skill} <b>{member.skillLevels?.[skill] ?? 3}/5</b>
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="member-edit-skills-btn"
                    onClick={() => setEditingMember(member)}
                  >
                    ✎ Đổi kỹ năng & mức độ (1–5)
                  </button>
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
                    <div className="task-main">
                      <div className="task-header-row">
                        <span className="task-tag">{task.category}</span>
                      </div>
                      <h3>{task.title}</h3>
                      <p>Deliverable: {task.deliverable}</p>
                      {task.reference_ids && task.reference_ids.length > 0 && (
                        <LabReferenceBadge references={task.reference_ids} showDetailsToggle={true} />
                      )}
                    </div>
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

      <PrivateProgressChat
        snapshot={snapshot}
        user={user}
        labId={currentLabId}
        isMock={snapshot.source === 'mock'}
      />

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

      {editingMember && (
        <MemberSkillProfileDialog
          open={Boolean(editingMember)}
          member={editingMember}
          labTitle="K4–L3B–DAY05–06–MINI–HACKATHON"
          onClose={() => setEditingMember(null)}
          onSave={handleSaveMemberSkills}
        />
      )}
    </>
  );
}

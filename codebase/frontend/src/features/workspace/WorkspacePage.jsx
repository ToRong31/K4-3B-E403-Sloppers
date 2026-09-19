import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { apiClient } from '../../api/createApiClient';
import { useAuth } from '../../auth/useAuth';
import { ErrorState, LoadingState } from '../../components/PageState';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { canonicalTasksFixture, defaultLabManifest } from '../../api/mockData';
import { AssignmentReviewDialog } from '../assignment/AssignmentReviewDialog';
import { LeaderGroupDialog } from '../group/LeaderGroupDialog';
import { GroupSettingsDialog } from '../group/GroupSettingsDialog';
import { MemberInviteFlow, MemberSkillProfileDialog } from '../profile/MemberInviteFlow';
import { PrivateProgressChat } from '../progress/PrivateProgressChat';
import { LabReferenceBadge } from '../labs/LabReferenceBadge';
import { CoachHelpDialog } from '../coach/CoachHelpDialog';
import { useRealtime } from '../../realtime/useRealtime';

const statusLabel = {
  accepted: 'Đã vào',
  pending: 'Chờ',
  declined: 'Từ chối',
};

export function WorkspacePage({ labId: propLabId, currentLabId: propCurrentLabId } = {}) {
  const { user } = useAuth();
  const { client: realtimeClient } = useRealtime();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const loader = useCallback(() => apiClient.getWorkspaceSnapshot(), []);
  const { status, data, error, reload } = useAsyncResource(loader);
  const [workspaceData, setWorkspaceData] = useState(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [coachHelpOpen, setCoachHelpOpen] = useState(false);
  const [supportRequests, setSupportRequests] = useState([]);
  const groupDialogTriggerRef = useRef(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeLog, setAnalyzeLog] = useState('');
  const [latestDraftId, setLatestDraftId] = useState(null);

  useEffect(() => {
    if (data) setWorkspaceData(data);
  }, [data]);

  useEffect(() => {
    if (!realtimeClient?.subscribe) return undefined;
    return realtimeClient.subscribe((event) => {
      if (event.type === 'snapshot' && event.payload?.group) {
        setWorkspaceData(event.payload);
        return;
      }
      if (event.type !== 'chat.message_sent') {
        apiClient.getWorkspaceSnapshot().then(setWorkspaceData).catch(() => undefined);
      }
      if (
        event.type === 'help_request.created' ||
        event.type === 'help_request.replied' ||
        event.type === 'help_request.resolved'
      ) {
        if (apiClient.getSupportRequests) {
          apiClient.getSupportRequests().then((reqs) => {
            if (reqs && Array.isArray(reqs)) setSupportRequests(reqs);
          }).catch(() => undefined);
        }
      }
    });
  }, [realtimeClient]);

  // Load support requests on mount & group change
  useEffect(() => {
    let ignore = false;
    async function loadSupportRequests() {
      try {
        if (apiClient.getSupportRequests) {
          const reqs = await apiClient.getSupportRequests();
          if (!ignore && reqs && Array.isArray(reqs)) {
            setSupportRequests(reqs);
          }
        }
      } catch (err) {
        console.warn('Could not load support requests:', err);
      }
    }
    loadSupportRequests();
    return () => {
      ignore = true;
    };
  }, [data?.group?.id, workspaceData?.group?.id]);

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

  const handleGroupCreated = async (group) => {
    if (apiClient.source === 'http') {
      const created = await apiClient.createGroup({
        lab_id: currentLabId,
        name: group.name,
        code: group.code,
        invitee_codes: group.invitees.map((student) => student.studentCode),
      });
      setWorkspaceData(await apiClient.getWorkspaceSnapshot());
      return { ...group, ...created };
    }
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

  const handleGroupUpdated = async (changes) => {
    if (apiClient.source === 'http') {
      const updated = await apiClient.updateGroup(snapshot.group.id, changes);
      setWorkspaceData(await apiClient.getWorkspaceSnapshot());
      return updated;
    }
    setWorkspaceData((current) => current ? {
      ...current,
      group: { ...current.group, ...changes },
    } : current);
    return { ...snapshot.group, ...changes };
  };

  const handleGroupDeleted = async () => {
    if (apiClient.source === 'http') await apiClient.deleteGroup(snapshot.group.id);
    setGroupSettingsOpen(false);
    navigate('/labs');
  };

  const handleRemoveMember = async (userId) => {
    if (apiClient.source === 'http') {
      await apiClient.removeGroupMember(snapshot.group.id, userId);
      setWorkspaceData(await apiClient.getWorkspaceSnapshot());
      return;
    }
    setWorkspaceData((current) => current ? {
      ...current,
      members: current.members.filter((member) => member.id !== userId),
    } : current);
  };

  const handleAnalyzeTask = async () => {
    setIsAnalyzing(true);
    setAnalyzeProgress(10);
    setAnalyzeLog(`1/4: Nạp dữ liệu bài LAB [${currentLabId}] & kiểm tra ref_id…`);

    const steps = [
      { at: 2000, pct: 28, msg: '2/4: Đang gọi mô hình gpt-4o-mini qua LangGraph task_analysis…' },
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
            checklistSource: `${draft?.lab_id ?? currentLabId} · AI Task Analysis (gpt-4o-mini)`,
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

  const handleInvitationChange = async (invitationStatus) => {
    if (apiClient.source === 'http') {
      await apiClient.respondInvitation(currentMember.membershipId, invitationStatus === 'accepted' ? 'accept' : 'decline');
      setWorkspaceData(await apiClient.getWorkspaceSnapshot());
      return;
    }
    updateCurrentMember({ status: invitationStatus, profileReady: false });
  };

  const handleProfileSaved = async (profileData) => {
    if (apiClient.source === 'http') {
      await apiClient.saveSkillProfile(snapshot.group.id, profileData);
      setWorkspaceData(await apiClient.getWorkspaceSnapshot());
      return;
    }
    updateCurrentMember({
      status: 'accepted',
      profileReady: true,
      industry: profileData.industry,
      skills: profileData.skills,
      skillLevels: profileData.skillLevels,
      skillsWithLevel: profileData.skillsWithLevel,
    });
  };

  const handlePlanApproved = async (assignments) => {
    if (apiClient.source === 'http') {
      const memberByName = new Map(snapshot.members.map((member) => [member.name, member]));
      for (const assignment of assignments.filter((item) => item.owner !== item.proposedOwner)) {
        const owner = memberByName.get(assignment.owner);
        if (owner) await apiClient.overrideAssignment(latestDraftId, assignment.taskId, owner.id);
      }
      await apiClient.approveAssignmentDraft(latestDraftId);
      setWorkspaceData(await apiClient.getWorkspaceSnapshot());
      return;
    }
    const ownerByTask = new Map(assignments.map((assignment) => [assignment.taskId, assignment.owner]));
    setWorkspaceData((current) => current ? {
      ...current,
      planStatus: 'approved',
      tasks: current.tasks.map((task) => ({ ...task, owner: ownerByTask.get(task.id) ?? task.owner })),
    } : current);
  };

  const generateAssignmentDraft = useCallback(() => {
    if (apiClient.source === 'http') {
      return apiClient.createGroupAssignmentDraft(snapshot.group.id).then((draft) => {
        setLatestDraftId(draft.id);
        return draft;
      });
    }
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

  const handleTaskStatus = async (task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    const updated = await apiClient.updateTask(task.id, {
      status: nextStatus,
      expected_version: task.version || undefined,
    });
    setWorkspaceData((current) => current ? {
      ...current,
      tasks: current.tasks.map((item) => item.id === task.id ? { ...item, ...updated } : item),
    } : current);
  };

  if (status === 'loading') return <main className="page-shell"><LoadingState label="Đang tải LabSpace…" /></main>;
  if (status === 'error') return <main className="page-shell"><ErrorState message={error.message} onRetry={reload} /></main>;

  const completed = (snapshot?.tasks ?? []).filter((task) => task.status === 'done').length;
  const totalTasks = snapshot?.tasks?.length ?? 0;
  const progress = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
  const isLeader = user.role === 'leader';
  const isMember = user.role === 'member';
  const currentMember = snapshot.members.find((member) => member.studentCode === user.accountId);
  const isPendingMember = isMember && currentMember?.status !== 'accepted';

  return (
    <>
      <main className="workspace-shell">
        <header className="workspace-header">
          <div>
            <p className="breadcrumbs">Lab › {currentLabId} › Nhóm {snapshot.group.name}</p>
            <h1>{isPendingMember ? 'LỜI MỜI LABSPACE' : `LABSPACE · ${snapshot.group.name.toUpperCase()}`}</h1>
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
            {!isPendingMember && <button className="secondary-button" type="button">Mã nhóm: <b>{snapshot.group.code}</b> ⧉</button>}
            {isLeader && <button className="secondary-button" type="button" onClick={() => setGroupSettingsOpen(true)}>⚙ Quản lý nhóm</button>}
          </div>
        </header>

        {isPendingMember ? (
          <section className="card pending-workspace-gate" aria-live="polite">
            <div className="pending-workspace-icon" aria-hidden="true">✉</div>
            <h2>{currentMember?.status === 'declined' ? 'Bạn đã từ chối lời mời' : 'Bạn chưa thể vào LabSpace'}</h2>
            <p>
              {currentMember?.status === 'declined'
                ? 'Nhóm trưởng có thể gửi một lời mời mới nếu bạn muốn tham gia.'
                : 'Hãy mở Thông báo để xác nhận lời mời. Chỉ thành viên đã xác nhận mới xem được kế hoạch và tiến độ nhóm.'}
            </p>
            <div className="pending-workspace-actions">
              <button className="secondary-button" type="button" onClick={() => navigate('/labs')}>Quay lại danh sách Lab</button>
              {currentMember?.status === 'pending' && <span>Đang chờ bạn phản hồi lời mời</span>}
            </div>
          </section>
        ) : (
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
                  {member.id === user.id && <button
                    type="button"
                    className="member-edit-skills-btn"
                    onClick={() => setEditingMember(member)}
                  >
                    ✎ Đổi kỹ năng & mức độ (1–5)
                  </button>}
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
              <div><h2>Kế hoạch của nhóm</h2><p>Dữ liệu được lưu trong workspace và đồng bộ theo thời gian thực.</p></div>
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
                    <button
                      type="button"
                      className={`task-check ${task.status === 'done' ? 'checked' : ''}`}
                      disabled={snapshot.planStatus !== 'approved' || (!isLeader && task.owner_id !== user.id)}
                      onClick={() => handleTaskStatus(task)}
                      aria-label={task.status === 'done' ? `Mở lại ${task.title}` : `Hoàn thành ${task.title}`}
                    >{task.status === 'done' ? '✓' : ''}</button>
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
              <h3>Deliverable của kế hoạch</h3>
              {snapshot.tasks.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', margin: '8px 0' }}>Chưa có deliverable nào.</p>
              ) : (
                snapshot.tasks.map((task) => <label key={task.id}><input type="checkbox" checked={task.status === 'done'} readOnly /> {task.deliverable}</label>)
              )}
            </div>
            {(() => {
              const pending = supportRequests.find((r) => r.status === 'pending');
              const resolved = supportRequests.filter((r) => r.status === 'resolved').pop();
              let label = '☝ Yêu cầu Coach hỗ trợ';
              let btnClass = 'danger-outline full';
              if (pending) {
                label = '⏳ Đang chờ Coach hỗ trợ (1 yêu cầu)';
                btnClass = 'danger-outline full pending-request';
              } else if (resolved) {
                label = '✓ Coach đã giải đáp · Gửi yêu cầu mới';
                btnClass = 'secondary-button full resolved-request';
              }
              return (
                <button
                  id="requestCoach"
                  className={btnClass}
                  type="button"
                  onClick={() => setCoachHelpOpen(true)}
                >
                  {label}
                </button>
              );
            })()}
            <p className="privacy-note">Coach chỉ thấy tiến độ nhóm và yêu cầu hỗ trợ được gửi.</p>
          </aside>
        </div>
        )}
      </main>

      {!isPendingMember && <PrivateProgressChat
          snapshot={snapshot}
          user={user}
          labId={currentLabId}
          isMock={snapshot.source === 'mock'}
        />}

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

      {isLeader && (
        <GroupSettingsDialog
          open={groupSettingsOpen}
          group={snapshot.group}
          members={snapshot.members}
          onClose={() => setGroupSettingsOpen(false)}
          onSave={handleGroupUpdated}
          onDelete={handleGroupDeleted}
          onRemoveMember={handleRemoveMember}
        />
      )}

      {editingMember && (
        <MemberSkillProfileDialog
          open={Boolean(editingMember)}
          member={editingMember}
          labTitle="K4–L3B–DAY05–06–MINI–HACKATHON"
          onClose={() => setEditingMember(null)}
          onSave={handleProfileSaved}
        />
      )}

      <CoachHelpDialog
        open={coachHelpOpen}
        onClose={() => setCoachHelpOpen(false)}
        group={snapshot?.group}
        user={user}
        supportRequests={supportRequests}
        onCreated={(newReq) => {
          setSupportRequests((prev) => [...prev, newReq]);
        }}
        apiClient={apiClient}
      />
    </>
  );
}

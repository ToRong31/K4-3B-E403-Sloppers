import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { apiClient } from '../../api/createApiClient';
import { useAuth } from '../../auth/useAuth';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { LeaderGroupDialog } from '../group/LeaderGroupDialog';
import { labLessons } from './labContent';

function CourseSidebar({ activeIndex, isOpen, onClose, onSelect }) {
  const submissionSelected = activeIndex === labLessons.length - 1;

  return (
    <aside className={`course-sidebar ${isOpen ? 'open' : ''}`} aria-label="Nội dung bài học">
      <div className="course-sidebar-title"><b>NỘI DUNG BÀI HỌC</b><button type="button" onClick={onClose} aria-label="Đóng mục lục">×</button></div>
      <div className="course-resource"><b>Slides</b><span>›</span></div>
      <div className="course-material"><span>⚗</span><b>k4-3a-d05-06-ai-product-hackathon</b><span>›</span></div>
      <div className="course-resource"><b>Video</b><span>›</span></div>
      <div className="course-name"><span>⚗</span><b>K4-L3B-DAY05-06-MINI-HACKATHON</b><span>⌄</span></div>

      <nav className="course-chapters" aria-label="Các chương của bài lab">
        {labLessons.slice(0, 6).map((lesson, index) => {
          const isDone = submissionSelected || index < activeIndex;
          return (
            <button className={index === activeIndex ? 'active' : ''} type="button" key={lesson.id} onClick={() => onSelect(lesson.id)}>
              <span className="chapter-number">{lesson.number}</span>
              <span className="chapter-label">{lesson.shortLabel}</span>
              {isDone && <span className="chapter-check">✓</span>}
              <span className="chapter-status">{index === activeIndex ? 'Đang học' : isDone ? 'Đã xong' : ''}</span>
            </button>
          );
        })}

        <div className="course-section-label">Nộp bài tổng kết và quy trình thuyết trình vòng thi (CP6)</div>
        {labLessons.slice(6).map((lesson, offset) => {
          const index = offset + 6;
          const isDone = submissionSelected && lesson.id === 'cp6';
          return (
            <button className={index === activeIndex ? 'active' : ''} type="button" key={lesson.id} onClick={() => onSelect(lesson.id)}>
              <span className="chapter-number">{lesson.id === 'submission' ? '▦' : lesson.number}</span>
              <span className="chapter-label">{lesson.shortLabel}</span>
              {isDone && <span className="chapter-check">✓</span>}
              <span className="chapter-status">{index === activeIndex ? 'Đang học' : isDone ? 'Đã xong' : ''}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function SubmissionPage() {
  return (
    <>
      <h1>Nộp bài và đánh giá Lab</h1>
      <section className="submission-success" aria-label="Trạng thái bài nộp">
        <span className="submission-check" aria-hidden="true">✓</span>
        <div>
          <h2>Đã nộp bài</h2>
          <p><span className="submission-stars" aria-label="Đánh giá 5 trên 5 sao">★★★★★</span> Đánh giá 5/5 sao <span>Nộp đúng hạn</span> <span>· Đã nộp lúc 20:51:10 17/9/2026</span></p>
          <button className="submission-link" type="button">↗ Xem bài đã nộp</button>
        </div>
        <button className="resubmit-button" type="button">Sửa / nộp lại</button>
      </section>
      <div className="lab-feedback" aria-label="Phản hồi bài học">
        <button type="button" aria-label="Hữu ích">♡</button>
        <button type="button" aria-label="Chưa hữu ích">♧</button>
        <button type="button" aria-label="Báo cáo nội dung">⚐</button>
      </div>
    </>
  );
}

export function LessonPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [createdGroup, setCreatedGroup] = useState(null);
  const groupCtaRef = useRef(null);
  const workspaceLoader = useCallback(
    () => apiClient.getWorkspaceSnapshot().catch((error) => {
      if (error.status === 404) return null;
      throw error;
    }),
    [],
  );
  const { data: workspaceSnapshot } = useAsyncResource(workspaceLoader);
  const directoryLoader = useCallback(
    () => apiClient.source === 'http' && user.role === 'leader'
      ? apiClient.getUserDirectory()
      : Promise.resolve([]),
    [user.role],
  );
  const { data: directoryData } = useAsyncResource(directoryLoader);
  const requestedLesson = searchParams.get('lesson') ?? labLessons[0].id;
  const activeIndex = Math.max(0, labLessons.findIndex((lesson) => lesson.id === requestedLesson));
  const activeLesson = labLessons[activeIndex];
  const LessonContent = activeLesson.component;
  const isLeader = user.role === 'leader';
  const isPreparation = activeLesson.id === 'prepare';
  const group = createdGroup ?? workspaceSnapshot?.group;
  const directory = useMemo(
    () => apiClient.source === 'http'
      ? (directoryData ?? [])
      : (workspaceSnapshot?.members ?? []).filter((member) => member.studentCode !== user.accountId),
    [directoryData, workspaceSnapshot?.members, user.accountId],
  );

  const completedCount = 0;

  useEffect(() => {
    if (requestedLesson !== activeLesson.id) setSearchParams({ lesson: activeLesson.id }, { replace: true });
  }, [activeLesson.id, requestedLesson, setSearchParams]);

  const selectLesson = (lessonId) => {
    setSearchParams({ lesson: lessonId });
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showComingSoon = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3200);
  };

  const closeGroupDialog = () => {
    setGroupDialogOpen(false);
    window.requestAnimationFrame(() => groupCtaRef.current?.focus());
  };

  const handleGroupCreated = async (newGroup) => {
    if (apiClient.source !== 'http') {
      setCreatedGroup(newGroup);
      return newGroup;
    }
    const persisted = await apiClient.createGroup({
      lab_id: 'K4-L3B-DAY05-06-MINI-HACKATHON',
      name: newGroup.name,
      code: newGroup.code,
      invitee_codes: newGroup.invitees.map((student) => student.studentCode),
    });
    const savedGroup = { ...newGroup, ...persisted };
    setCreatedGroup(savedGroup);
    return savedGroup;
  };

  return (
    <main className="course-reader">
      <header className="course-topbar">
        <button className="course-back" type="button" onClick={() => navigate('/labs')} aria-label="Quay lại danh sách Lab">←</button>
        <b>Bài 16 · MINI HACKATHON</b>
        <button className="course-menu-button" type="button" onClick={() => setSidebarOpen(true)}>☰ Mục lục</button>
        <div className="course-progress"><b>{completedCount}/21 bài</b><span><i style={{ width: `${(completedCount / 21) * 100}%` }} /></span></div>
        {isLeader && <button ref={groupCtaRef} className="course-labspace-button" type="button" onClick={() => group ? navigate('/workspace') : setGroupDialogOpen(true)}>{group ? 'Mở LabSpace' : '＋ Lập nhóm Lab'}</button>}
        <button className="course-tool" type="button" onClick={() => showComingSoon('Trợ lý AI sẽ được kết nối ở bước tích hợp backend.')}><span>✦</span> Đặt câu hỏi với AI</button>
        <button className="course-tool" type="button" onClick={() => showComingSoon('Tính năng gửi yêu cầu sẽ được nối với Coach ở bước realtime.')}><span>♨</span> Gửi yêu cầu</button>
        <span className="course-avatar">L</span>
      </header>

      {notice && <div className="integration-notice" role="status">{notice}</div>}

      <div className="course-layout">
        {sidebarOpen && <button className="sidebar-scrim" type="button" aria-label="Đóng mục lục" onClick={() => setSidebarOpen(false)} />}
        <CourseSidebar activeIndex={activeIndex} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onSelect={selectLesson} />

        <article className={`course-article ${activeLesson.id === 'submission' ? 'submission-article' : ''}`}>
          {isPreparation && (
            <aside className="lesson-labspace-entry" aria-label="Khởi tạo LabSpace">
              <div>
                <span>LABSPACE · BƯỚC 1</span>
                <h2>{isLeader ? 'Lập nhóm trước khi bắt đầu Mini Hackathon' : 'Chờ lời mời nhóm LabSpace'}</h2>
                <p>{isLeader
                  ? 'Tạo nhóm cho bài Lab này, mời thành viên bằng mã học viên và sau đó theo dõi tiến độ trong LabSpace.'
                  : 'Nhóm trưởng sẽ gửi lời mời đến Thông báo của bạn. Bạn tự xác nhận và khai hồ sơ năng lực cho phiên Lab.'}</p>
              </div>
              {isLeader ? (
                <p className="lesson-labspace-hint">{createdGroup ? `✓ Nhóm ${createdGroup.code} đã được tạo. ` : ''}Dùng nút <b>“Lập nhóm Lab”</b> trên thanh bài học để mở thao tác ở bất kỳ checkpoint nào.</p>
              ) : <button className="secondary-button" type="button" onClick={() => navigate('/workspace')}>Mở LabSpace</button>}
            </aside>
          )}
          {LessonContent ? <LessonContent /> : <SubmissionPage />}
          <footer className="lesson-pagination">
            <button type="button" disabled={activeIndex === 0} onClick={() => selectLesson(labLessons[activeIndex - 1].id)}>‹ <span>Bài trước</span></button>
            <button className="next" type="button" disabled={activeLesson.id === 'submission'} onClick={() => selectLesson(labLessons[activeIndex + 1].id)}>
              <span>{activeIndex === labLessons.length - 2 ? 'Đi tới phần nộp bài' : 'Đi tới bài tiếp theo'}</span> ›
            </button>
          </footer>
        </article>
      </div>
      {isLeader && (
        <LeaderGroupDialog
          open={groupDialogOpen}
          directory={directory}
          initialGroupName="Nhóm mới"
          labTitle="K4–L3B–DAY05–06–MINI–HACKATHON"
          leaderCode={user.accountId}
          onCreated={handleGroupCreated}
          onEnterLabSpace={() => {
            closeGroupDialog();
            navigate('/workspace');
          }}
          onClose={closeGroupDialog}
        />
      )}
    </main>
  );
}

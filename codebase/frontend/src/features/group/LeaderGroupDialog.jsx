import { useEffect, useMemo, useRef, useState } from 'react';

const normalizeCode = (value) => value.trim().toUpperCase();

export function resolveInviteSlot(code, directory, leaderCode, allCodes = []) {
  const normalized = normalizeCode(code);
  if (!normalized) return { status: 'empty', student: null, message: 'Chưa nhập mã' };
  if (normalized === normalizeCode(leaderCode ?? '')) {
    return { status: 'self', student: null, message: 'Không thể mời chính mình' };
  }
  if (allCodes.filter((item) => normalizeCode(item) === normalized).length > 1) {
    return { status: 'duplicate', student: null, message: 'Mã học viên bị trùng' };
  }

  const student = directory.find((item) => normalizeCode(item.studentCode) === normalized) ?? null;
  if (!student) return { status: 'not-found', student: null, message: 'Chưa tìm thấy trong lớp K4' };
  return { status: 'matched', student, message: 'Đã nhận diện' };
}

export function buildDemoGroupCode(groupName) {
  const compactName = groupName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (letter) => letter === 'đ' ? 'd' : 'D')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
  return `${(compactName.slice(0, 4) || 'TEAM').padEnd(4, 'X')}-3B`;
}

function createSlots(codes) {
  return codes.map((code, index) => ({ id: `invite-slot-${index + 1}`, code }));
}

export function LeaderGroupDialog({ directory, initialGroupName, labTitle, leaderCode, onClose, onCreated, onEnterLabSpace, open }) {
  const dialogRef = useRef(null);
  const slotSequence = useRef(4);
  const [groupName, setGroupName] = useState(initialGroupName);
  const [slots, setSlots] = useState(() => createSlots(directory.slice(0, 3).map((member) => member.studentCode)));
  const [createdGroup, setCreatedGroup] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setGroupName(initialGroupName);
      setSlots(createSlots(directory.slice(0, 3).map((member) => member.studentCode)));
      setCreatedGroup(null);
      setSubmitting(false);
      setSubmitError('');
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [directory, initialGroupName, open]);

  const codes = useMemo(() => slots.map((slot) => slot.code), [slots]);
  const resolutions = useMemo(
    () => slots.map((slot) => resolveInviteSlot(slot.code, directory, leaderCode, codes)),
    [codes, directory, leaderCode, slots],
  );
  const matchedStudents = resolutions
    .filter((resolution) => resolution.status === 'matched')
    .map((resolution) => resolution.student);
  const hasInvalidCode = resolutions.some((resolution, index) => slots[index].code && resolution.status !== 'matched');
  const canCreate = groupName.trim().length >= 3 && matchedStudents.length > 0 && !hasInvalidCode;

  const updateSlot = (slotId, code) => {
    setSlots((current) => current.map((slot) => slot.id === slotId ? { ...slot, code } : slot));
  };

  const addSlot = () => {
    if (slots.length >= 3) return;
    const id = `invite-slot-${slotSequence.current}`;
    slotSequence.current += 1;
    setSlots((current) => [...current, { id, code: '' }]);
  };

  const removeSlot = (slotId) => {
    setSlots((current) => current.filter((slot) => slot.id !== slotId));
  };

  const fillQuickCode = (studentCode) => {
    const emptySlot = slots.find((slot) => !slot.code);
    if (emptySlot) {
      updateSlot(emptySlot.id, studentCode);
      return;
    }
    const alreadyUsed = codes.some((code) => normalizeCode(code) === studentCode);
    if (!alreadyUsed && slots.length < 3) {
      const id = `invite-slot-${slotSequence.current}`;
      slotSequence.current += 1;
      setSlots((current) => [...current, { id, code: studentCode }]);
    }
  };

  const handleCreate = async () => {
    if (!canCreate) return;
    const group = {
      name: groupName.trim(),
      code: buildDemoGroupCode(groupName),
      invitees: matchedStudents,
    };
    setSubmitting(true);
    setSubmitError('');
    try {
      const persisted = await onCreated(group);
      setCreatedGroup({ ...group, ...(persisted ?? {}) });
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog ref={dialogRef} className="group-setup-dialog" onClose={onClose} onCancel={onClose} aria-labelledby="leader-group-dialog-title">
      <header className="group-dialog-header">
        <div>
          <span>VIEW NHÓM TRƯỞNG · PHẠM HOÀNG TRỌNG · VLEARN LABSPACE</span>
          <h2 id="leader-group-dialog-title">{createdGroup ? 'Nhóm đã được tạo' : 'Lập nhóm Lab'}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Đóng dialog">×</button>
      </header>

      {!createdGroup ? (
        <section className="group-dialog-body">
          <p className="group-dialog-intro">Nhập mã học viên để gửi lời mời. Mỗi học viên sẽ tự xác nhận trong <b>Thông báo</b> của tài khoản mình; nhóm trưởng không xác nhận thay.</p>

          <div className="group-basic-fields">
            <label>Tên nhóm
              <input value={groupName} onChange={(event) => setGroupName(event.target.value)} maxLength={40} autoFocus />
              {groupName.trim().length < 3 && <small>Tên nhóm cần ít nhất 3 ký tự.</small>}
            </label>
            <label>Bài LAB
              <input value={labTitle} disabled />
            </label>
          </div>

          <section className="student-blocks" aria-labelledby="student-blocks-title">
            <header>
              <div><b id="student-blocks-title">🪪 MÃ HỌC VIÊN THÀNH VIÊN</b><p>Hệ thống đối chiếu danh sách lớp từ backend và hiển thị họ tên ngay khi nhập.</p></div>
              <button type="button" onClick={addSlot} disabled={slots.length >= 3}>＋ Thêm ô mời</button>
            </header>

            <div className="invite-slot-list">
              {slots.map((slot, index) => {
                const resolution = resolutions[index];
                return (
                  <article className={`invite-slot-card ${resolution.status}`} key={slot.id}>
                    <div className="invite-slot-heading">
                      <span><i>{String(index + 1).padStart(2, '0')}</i><b>Thành viên {index + 1}</b></span>
                      <span className={`invite-status ${resolution.status}`}>{resolution.status === 'matched' ? '✓' : resolution.status === 'empty' ? '○' : '⚠'} {resolution.message}</span>
                      {slots.length > 1 && <button type="button" onClick={() => removeSlot(slot.id)} aria-label={`Xóa ô mời thành viên ${index + 1}`}>×</button>}
                    </div>
                    <div className="invite-slot-content">
                      <label>
                        <span className="sr-only">Mã học viên thành viên {index + 1}</span>
                        <input value={slot.code} onChange={(event) => updateSlot(slot.id, event.target.value)} placeholder="VD: 2A202602678" />
                      </label>
                      <div className={`resolved-student ${resolution.status === 'matched' ? 'active' : ''}`}>
                        {resolution.student ? (
                          <>
                            <span className="resolved-student-avatar" style={{ background: resolution.student.color }}>{resolution.student.avatar}</span>
                            <div><b>{resolution.student.fullName}</b><small>{resolution.student.className}</small></div>
                          </>
                        ) : <small>{resolution.status === 'empty' ? 'Nhập mã học viên để hệ thống hiển thị hồ sơ…' : resolution.message}</small>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="quick-student-codes">
              <span>Gợi ý nhanh mã nhóm:</span>
              {directory.map((student) => (
                <button type="button" key={student.studentCode} onClick={() => fillQuickCode(student.studentCode)}>{student.studentCode} · {student.name}</button>
              ))}
            </div>
          </section>

          <div className="leader-setup-notice">⌁ Sau khi tạo nhóm, hệ thống sẽ lưu nhóm và gửi <b>{matchedStudents.length} lời mời</b>{matchedStudents.length ? ` tới ${matchedStudents.map((student) => student.name).join(', ')}` : ''}.</div>
          {submitError && <p className="form-error" role="alert">{submitError}</p>}
          <footer className="group-dialog-actions">
            <button className="secondary-button" type="button" onClick={onClose}>Hủy</button>
            <button className="primary-button" type="button" disabled={!canCreate || submitting} onClick={handleCreate}>{submitting ? 'Đang lưu…' : `Tạo nhóm & gửi ${matchedStudents.length} lời mời →`}</button>
          </footer>
        </section>
      ) : (
        <section className="group-created-state">
          <span className="group-created-check">✓</span>
          <h3>{createdGroup.name}</h3>
          <p>Nhóm <b>{createdGroup.code}</b> đã được lưu và sẵn sàng trong LabSpace.</p>
          <div className="sent-invitation-list">
            {createdGroup.invitees.map((student) => (
              <div key={student.studentCode}>
                <span className="resolved-student-avatar" style={{ background: student.color }}>{student.avatar}</span>
                <span><b>{student.fullName}</b><small>{student.studentCode}</small></span>
                <em>Đã gửi · Chờ xác nhận</em>
              </div>
            ))}
          </div>
          <div className="leader-setup-notice">Lời mời đã được lưu; thành viên sẽ tự xác nhận trong phiên đăng nhập của mình.</div>
          <footer className="group-dialog-actions"><button className="primary-button" type="button" onClick={onEnterLabSpace ?? onClose}>Vào LabSpace →</button></footer>
        </section>
      )}
    </dialog>
  );
}
